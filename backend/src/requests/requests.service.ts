import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BuyerRequest } from "./entities/buyer-request.entity";
import { RequestOffer } from "./entities/request-offer.entity";
import { MatchingService } from "./matching.service";
import { ConfigService } from "../config/config.service";
import { CollusionService } from "../collusion/collusion.service";
import { GuaranteesService } from "../guarantees/guarantees.service";
import { MessagesGateway } from "../messages/messages.gateway";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(BuyerRequest) private readonly requestsRepo: Repository<BuyerRequest>,
    @InjectRepository(RequestOffer) private readonly offersRepo: Repository<RequestOffer>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly matching: MatchingService,
    private readonly config: ConfigService,
    private readonly collusion: CollusionService,
    private readonly guarantees: GuaranteesService,
    private readonly gateway: MessagesGateway,
    private readonly audit: AuditService,
  ) {}

  private num(v: any): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  /** Difusión en tiempo real de ofertas en una solicitud (subasta inversa / RFQ) */
  private async emitRequestUpdate(requestId: string, estado: string = "abierta") {
    try {
      const [r] = await this.dataSource.query(
        `SELECT COUNT(*)::int AS offers_count, MIN(precio) AS mejor_precio
         FROM request_offers WHERE request_id = $1 AND estado = 'pendiente'`,
        [requestId],
      );
      this.gateway.notifyRequestUpdate(requestId, {
        offers_count: Number(r?.offers_count || 0),
        mejor_precio: r?.mejor_precio != null ? Number(r.mejor_precio) : null,
        estado,
      });
    } catch {}
  }

  // ─── Solicitudes del comprador ──────────────────────────

  async create(userId: string, dto: any) {
    const title = String(dto?.title || "").trim();
    if (!title) throw new BadRequestException("El título de la solicitud es obligatorio");
    const category = await this.dataSource.query(
      `SELECT id FROM categories WHERE id = $1`, [dto?.category_id],
    );
    if (!category.length) throw new BadRequestException("Categoría inválida");

    const cantidad = Math.max(1, Math.floor(this.num(dto?.cantidad) ?? 1));
    const cmc = Math.max(1, Math.floor(this.num(dto?.cmc) ?? 1));
    const nivelCoincidencia = ["estricta", "flexible", "amplia"].includes(dto?.nivel_coincidencia)
      ? dto.nivel_coincidencia : "estricta";
    if (dto?.cantidad_objetivo != null && (this.num(dto.cantidad_objetivo) ?? 0) < 1) {
      throw new BadRequestException("La cantidad objetivo debe ser mayor o igual a 1");
    }
    if (dto?.cantidad_objetivo != null && cmc > (this.num(dto.cantidad_objetivo) ?? 0)) {
      throw new BadRequestException("La CMC no puede superar la cantidad objetivo");
    }
    const req = this.requestsRepo.create({
      user_id: userId,
      category_id: dto.category_id,
      title,
      description: dto?.description ?? null,
      specifications: dto?.specifications && typeof dto.specifications === "object" ? dto.specifications : {},
      image: dto?.image ?? null,
      precio_minimo: this.num(dto?.precio_minimo),
      precio_maximo: this.num(dto?.precio_maximo),
      precio_objetivo: this.num(dto?.precio_objetivo),
      cantidad,
      cantidad_objetivo: this.num(dto?.cantidad_objetivo),
      cmc,
      ua: dto?.ua || null,
      ficha_tecnica: dto?.ficha_tecnica && typeof dto.ficha_tecnica === "object" ? dto.ficha_tecnica : null,
      nivel_coincidencia: nivelCoincidencia,
      fecha_limite: dto?.fecha_limite
        ? new Date(dto.fecha_limite)
        : new Date(Date.now() + (await this.config.getNum("tiempo_public_rfq_horas")) * 3600 * 1000),
      estado: "abierta",
    });
    await this.requestsRepo.save(req);
    return this.findOne(req.id);
  }

  async list(params: any = {}) {
    const page = Math.max(1, Math.floor(Number(params.page) || 1));
    const limit = Math.min(50, Math.max(1, Math.floor(Number(params.limit) || 20)));
    const clauses: string[] = ["r.estado = 'abierta'"];
    const values: any[] = [];
    if (params.category_id) {
      values.push(params.category_id);
      clauses.push(`r.category_id = $${values.length}`);
    }
    if (params.q) {
      values.push(`%${String(params.q)}%`);
      clauses.push(`(r.title ILIKE $${values.length} OR r.description ILIKE $${values.length})`);
    }
    const where = clauses.join(" AND ");
    values.push(limit);
    const off = (page - 1) * limit;
    values.push(off);

    const [rows, totalRows] = await Promise.all([
      this.dataSource.query(
        `SELECT r.*,
           json_build_object('id', u.id, 'first_name', up.first_name, 'last_name', up.last_name) AS buyer,
           (SELECT COUNT(*)::int FROM request_offers ro WHERE ro.request_id = r.id AND ro.estado = 'pendiente') AS offers_count
         FROM buyer_requests r
         LEFT JOIN users u ON u.id = r.user_id
         LEFT JOIN user_profiles up ON up.user_id = r.user_id
         WHERE ${where}
         ORDER BY r.created_at DESC
         LIMIT $${values.length - 1} OFFSET $${values.length}`,
        values,
      ),
      this.dataSource.query(
        `SELECT COUNT(*)::int AS n FROM buyer_requests r WHERE ${where}`,
        values.slice(0, values.length - 2),
      ),
    ]);
    return { items: rows, total: totalRows[0]?.n ?? 0, page, limit };
  }

  async findOne(id: string) {
    const rows = await this.dataSource.query(
      `SELECT r.*,
         json_build_object('id', u.id, 'first_name', up.first_name, 'last_name', up.last_name, 'phone', u.phone) AS buyer,
         (SELECT COUNT(*)::int FROM request_offers ro WHERE ro.request_id = r.id AND ro.estado = 'pendiente') AS offers_count
       FROM buyer_requests r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN user_profiles up ON up.user_id = r.user_id
       WHERE r.id = $1`, [id],
    );
    if (!rows.length) throw new NotFoundException("Solicitud no encontrada");
    return rows[0];
  }

  async listMine(userId: string) {
    return this.dataSource.query(
      `SELECT r.*,
         (SELECT COUNT(*)::int FROM request_offers ro WHERE ro.request_id = r.id AND ro.estado = 'pendiente') AS offers_count
       FROM buyer_requests r
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`, [userId],
    );
  }

  async update(userId: string, id: string, dto: any) {
    const req = await this.requestsRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException("Solicitud no encontrada");
    if (req.user_id !== userId) throw new ForbiddenException("No puedes editar esta solicitud");
    if (req.estado !== "abierta") throw new BadRequestException("La solicitud ya no está abierta");

    if (dto?.title !== undefined) req.title = String(dto.title).trim();
    if (dto?.description !== undefined) req.description = dto.description ?? null;
    if (dto?.image !== undefined) req.image = dto.image ?? null;
    if (dto?.precio_minimo !== undefined) req.precio_minimo = this.num(dto.precio_minimo);
    if (dto?.precio_maximo !== undefined) req.precio_maximo = this.num(dto.precio_maximo);
    if (dto?.precio_objetivo !== undefined) req.precio_objetivo = this.num(dto.precio_objetivo);
    if (dto?.cantidad !== undefined) req.cantidad = Math.max(1, Math.floor(this.num(dto.cantidad) ?? 1));
    if (dto?.cantidad_objetivo !== undefined) {
      req.cantidad_objetivo = this.num(dto.cantidad_objetivo);
      if (req.cantidad_objetivo != null && req.cantidad_objetivo < 1) {
        throw new BadRequestException("La cantidad objetivo debe ser mayor o igual a 1");
      }
    }
    if (dto?.cmc !== undefined) {
      req.cmc = Math.max(1, Math.floor(this.num(dto.cmc) ?? 1));
      if (req.cantidad_objetivo != null && req.cmc > req.cantidad_objetivo) {
        throw new BadRequestException("La CMC no puede superar la cantidad objetivo");
      }
    }
    if (dto?.ua !== undefined) req.ua = dto.ua || null;
    if (dto?.ficha_tecnica !== undefined) req.ficha_tecnica = dto.ficha_tecnica && typeof dto.ficha_tecnica === "object" ? dto.ficha_tecnica : null;
    if (dto?.nivel_coincidencia !== undefined && ["estricta", "flexible", "amplia"].includes(dto.nivel_coincidencia)) {
      req.nivel_coincidencia = dto.nivel_coincidencia;
    }
    if (dto?.fecha_limite !== undefined) req.fecha_limite = dto.fecha_limite ? new Date(dto.fecha_limite) : null;
    if (dto?.specifications && typeof dto.specifications === "object") req.specifications = dto.specifications;
    await this.requestsRepo.save(req);
    return this.findOne(id);
  }

  async cancel(userId: string, id: string) {
    const req = await this.requestsRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException("Solicitud no encontrada");
    if (req.user_id !== userId) throw new ForbiddenException("No puedes cancelar esta solicitud");
    if (req.estado !== "abierta") throw new BadRequestException("La solicitud ya no está abierta");
    req.estado = "cancelada";
    await this.requestsRepo.save(req);
    const pending = await this.offersRepo.find({ where: { request_id: id, estado: "pendiente" } });
    await this.offersRepo.update({ request_id: id, estado: "pendiente" }, { estado: "rechazada" });
    for (const o of pending) await this.releaseOfferGuarantee(o.id, o.seller_id, o.garantia_oferta);
    return { message: "Solicitud cancelada" };
  }

  /** Libera la garantía de oferta reservada de una oferta (al rechazarla o cancelarla). */
  private async releaseOfferGuarantee(offerId: string, sellerId: string, garantiaOferta: number) {
    try {
      if (!Number(garantiaOferta) || Number(garantiaOferta) <= 0) return;
      await this.dataSource.query(
        `UPDATE funds
         SET available_balance = available_balance + $2, pending_balance = GREATEST(pending_balance - $2, 0)
         WHERE user_id = $1`,
        [sellerId, Number(garantiaOferta)],
      );
      await this.offersRepo.update(offerId, { garantia_oferta_reservada: false, garantia_oferta: 0 });
    } catch (e: any) {
      console.error("[Requests] Error liberando garantía de oferta:", e.message);
    }
  }

  // ─── Coincidencia de producto ────────────────────────────

  /** Análisis de coincidencia entre un producto del vendedor y una solicitud (base: estricta). */
  async checkCoincidencia(userId: string, requestId: string, productId: string) {
    const req = await this.requestsRepo.findOne({ where: { id: requestId } });
    if (!req) throw new NotFoundException("Solicitud no encontrada");
    if (req.estado !== "abierta") throw new BadRequestException("La solicitud ya no está abierta");

    const product = await this.dataSource.query(
      `SELECT id, title, category_id, specifications, nivel_coincidencia FROM products
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`, [productId, userId],
    );
    if (!product.length) throw new BadRequestException("Selecciona un producto tuyo existente");
    const p = product[0];

    const fields = await this.dataSource.query(
      `SELECT name, label, grupo FROM category_fields WHERE category_id = $1`, [req.category_id],
    );
    const result = this.matching.calcularCoincidencia(p.specifications, req.specifications, fields);
    return {
      ...result,
      mismo_categoria: p.category_id === req.category_id,
      producto: { id: p.id, title: p.title, nivel_coincidencia: p.nivel_coincidencia || "estricta" },
      regla: req.nivel_coincidencia || "estricta",
    };
  }

  // ─── Ofertas de los vendedores ──────────────────────────

  async makeOffer(userId: string, requestId: string, dto: any, ctx?: { ip?: string; userAgent?: string }) {
    const req = await this.requestsRepo.findOne({ where: { id: requestId } });
    if (!req) throw new NotFoundException("Solicitud no encontrada");
    if (req.estado !== "abierta") throw new BadRequestException("La solicitud ya no acepta ofertas");
    if (req.user_id === userId) throw new ForbiddenException("No puedes ofertar en tu propia solicitud");

    // Bloqueo por comportamiento sospechoso (colusión)
    await this.collusion.assertNotBlocked(userId);

    // Bloqueo por sanción de incumplimiento de pago
    await this.collusion.assertNotSanctioned(userId);

    const product = await this.dataSource.query(
      `SELECT id, title, category_id, specifications, nivel_coincidencia, status FROM products WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`, [dto?.product_id, userId],
    );
    if (!product.length) throw new BadRequestException("Selecciona un producto tuyo existente");
    const p = product[0];
    if (p.status !== "active") throw new BadRequestException("El producto debe estar aprobado y activo");
    if (p.category_id !== req.category_id) {
      throw new BadRequestException("El producto debe pertenecer a la misma categoría que la solicitud");
    }

    const precio = this.num(dto?.precio);
    if (precio === null || precio <= 0) throw new BadRequestException("Ingresa un precio válido");
    const cantidad = Math.max(1, Math.floor(this.num(dto?.cantidad) ?? req.cantidad ?? 1));
    const envio = Math.max(0, this.num(dto?.costo_envio) ?? 0);

    // Coincidencia de producto (regla configurada por el comprador: estricta | flexible | amplia)
    const fields = await this.dataSource.query(
      `SELECT name, label, grupo FROM category_fields WHERE category_id = $1`, [req.category_id],
    );
    const match = this.matching.calcularCoincidencia(p.specifications, req.specifications, fields);
    const reglaReq = req.nivel_coincidencia || "estricta";
    // Con regla flexible se permiten diferencias solo en atributos secundarios (1).
    // Con regla amplia se permiten diferencias en atributos secundarios (ilimitadas).
    const variantesPermitidas = reglaReq === "amplia";
    const secundariosMin = reglaReq === "flexible" ? 1 : 0;
    const requiereVariante = match.nivel !== "estricta" && !variantesPermitidas;
    const necEsVariante = requiereVariante;
    if (necEsVariante && !Boolean(dto?.es_variante)) {
      const detalle = match.faltantes.length
        ? `faltan: ${match.faltantes.map(d => d.label).join(", ")}`
        : `varía: ${match.variantes.map(d => d.label).join(", ")}`;
      throw new BadRequestException(
        `Tu producto no coincide ${reglaReq}mente con la solicitud (${detalle}). ` +
        `Márcalo como variante para ofertarlo y el comprador deberá aceptarlo expresamente.`,
      );
    }
    if (necEsVariante && !String(dto?.mensaje || "").trim()) {
      throw new BadRequestException("Al ofrecer una variante debes explicar en un mensaje en qué se diferencia");
    }

    const existing = await this.offersRepo.findOne({
      where: { request_id: requestId, seller_id: userId, estado: "pendiente" },
    });
    if (existing) throw new BadRequestException("Ya tienes una oferta pendiente en esta solicitud");

    // Anti-flood: límite de ofertas pendientes activas por vendedor
    const maxOfertas = await this.config.getNum("max_ofertas_pendientes");
    const [ofertasCount] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS n FROM request_offers WHERE seller_id = $1 AND estado = 'pendiente'`,
      [userId],
    );
    if (Number(ofertasCount?.n || 0) >= maxOfertas) {
      throw new BadRequestException(
        `Tienes demasiadas ofertas pendientes. Espera a que se resuelvan para ofertar de nuevo (máximo ${maxOfertas}).`,
      );
    }

    // Garantía de oferta: compromiso real al ofertar (se reserva de fondos disponibles)
    const montoOferta = precio * cantidad + envio;
    const calcOferta = await this.guarantees.calcular({ canal: "oferta", categoriaId: req.category_id, base: montoOferta });
    const garantiaOfertaPct = calcOferta.pct_aplicado;
    const garantiaOferta = calcOferta.monto;
    const [fund] = await this.dataSource.query(
      `SELECT COALESCE(available_balance, 0) AS available FROM funds WHERE user_id = $1`,
      [userId],
    );
    if (Number(fund?.available || 0) < garantiaOferta) {
      throw new BadRequestException(
        `Necesitas S/ ${garantiaOferta.toFixed(2)} disponibles en tu billetera como garantía de oferta (${garantiaOfertaPct}% del monto).`,
      );
    }
    await this.dataSource.query(
      `UPDATE funds
       SET available_balance = available_balance - $2, pending_balance = pending_balance + $2
       WHERE user_id = $1`,
      [userId, garantiaOferta],
    );

    let garantiaPct: number | null = null;
    if (dto?.garantia_pct !== undefined && dto?.garantia_pct !== null && dto?.garantia_pct !== "") {
      const minPct = await this.config.getPct("garantia_subasta_inversa_pct");
      garantiaPct = Math.floor(Number(dto.garantia_pct));
      if (!Number.isFinite(garantiaPct) || garantiaPct < minPct || garantiaPct > 100) {
        throw new BadRequestException(`La garantía de compromiso debe estar entre ${minPct}% y 100%`);
      }
    }

    const offer = this.offersRepo.create({
      request_id: requestId,
      seller_id: userId,
      product_id: dto.product_id,
      precio,
      cantidad,
      costo_envio: envio,
      mensaje: dto?.mensaje ?? null,
      estado: "pendiente",
      es_variante: necEsVariante,
      coincidencia: match.nivel,
      garantia_pct: garantiaPct,
      garantia_oferta: garantiaOferta,
      garantia_oferta_reservada: true,
    });
    await this.offersRepo.save(offer);
    await this.emitRequestUpdate(requestId);

    // Notificación dirigida al comprador: nueva oferta recibida
    try {
      const tituloSolicitud = (req as any).title || "tu solicitud";
      this.gateway.notifyUser(req.user_id, {
        tipo: "nueva_oferta",
        titulo: "Nueva oferta en tu solicitud",
        mensaje: `"${tituloSolicitud}": oferta de S/ ${precio.toFixed(2)} por ${cantidad} unidad(es).`,
        url: `/solicitudes/${requestId}`,
      });
    } catch {}

    // Registro de señal para detección de colusión (IP + monto)
    this.collusion
      .recordSignal({
        eventType: "solicitud",
        eventId: requestId,
        userId,
        amount: precio * cantidad + envio,
        ip: ctx?.ip,
        userAgent: ctx?.userAgent,
      })
      .catch(() => {});

    return offer;
  }

  async myOffer(userId: string, requestId: string) {
    return this.dataSource.query(
      `SELECT ro.*, json_build_object('id', p.id, 'title', p.title, 'nivel_coincidencia', p.nivel_coincidencia) AS product
       FROM request_offers ro
       LEFT JOIN products p ON p.id = ro.product_id
       WHERE ro.request_id = $1 AND ro.seller_id = $2
       ORDER BY ro.created_at DESC`, [requestId, userId],
    );
  }

  async offersForRequest(userId: string, requestId: string) {
    const req = await this.requestsRepo.findOne({ where: { id: requestId } });
    if (!req) throw new NotFoundException("Solicitud no encontrada");
    if (req.user_id !== userId) throw new ForbiddenException("Solo el solicitante puede ver las ofertas");
    return this.dataSource.query(
      `SELECT ro.*,
         json_build_object('id', u.id, 'first_name', up.first_name, 'last_name', up.last_name, 'email', u.email, 'phone', u.phone) AS seller,
         json_build_object('id', p.id, 'title', p.title, 'nivel_coincidencia', p.nivel_coincidencia) AS product
       FROM request_offers ro
       LEFT JOIN users u ON u.id = ro.seller_id
       LEFT JOIN user_profiles up ON up.user_id = ro.seller_id
       LEFT JOIN products p ON p.id = ro.product_id
       WHERE ro.request_id = $1
       ORDER BY ro.created_at ASC`, [requestId],
    );
  }

  async acceptOffer(userId: string, requestId: string, offerId: string, dto: any = {}) {
    const req = await this.requestsRepo.findOne({ where: { id: requestId } });
    if (!req) throw new NotFoundException("Solicitud no encontrada");
    if (req.user_id !== userId) throw new ForbiddenException("Solo el solicitante puede aceptar ofertas");
    if (req.estado !== "abierta") throw new BadRequestException("La solicitud ya no está abierta");

    const offer = await this.offersRepo.findOne({ where: { id: offerId, request_id: requestId } });
    if (!offer) throw new NotFoundException("Oferta no encontrada");
    if (offer.estado !== "pendiente") throw new BadRequestException("La oferta ya no está disponible");
    if (offer.seller_id === userId) throw new BadRequestException("No puedes aceptar tu propia oferta");
    if (offer.es_variante && !Boolean(dto?.aceptar_variante)) {
      throw new BadRequestException(
        "Esta oferta es una variante de tu especificación. Debes aceptarla expresamente para continuar.",
      );
    }

    const qty = Math.max(1, Math.floor(Number(offer.cantidad) || 1));
    const unitPrice = Number(offer.precio) || 0;
    const shipping = Number(offer.costo_envio) || 0;
    const total = Number((unitPrice * qty + shipping).toFixed(2));

    // Requisito RFQ: el compromiso del vendedor debe cubrir al menos la CMC definida por el comprador.
    const cmcReq = Math.max(1, Number(req.cmc) || 1);
    if (qty < cmcReq) {
      throw new BadRequestException(
        `El compromiso mínimo por oferta (CMC) es de ${cmcReq} unidad(es); esta oferta solo entrega ${qty}. Contáctate con el vendedor o rechaza la oferta.`,
      );
    }

    const pct = offer.garantia_pct ?? null;
    const calc = await this.guarantees.calcular({ canal: "subasta_inversa", categoriaId: req.category_id, base: total, pctOverride: pct });
    const guarantee = calc.monto;
    const saldo = Number((total - guarantee).toFixed(2));

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const [order] = await qr.query(
        `INSERT INTO orders (user_id, total_amount, shipping_cost, status, payment_stage, created_at, updated_at)
         VALUES ($1, $2, $3, 'pending_payment', 'garantia', NOW(), NOW()) RETURNING id, total_amount`,
        [userId, guarantee, shipping],
      );
      await qr.query(
        `INSERT INTO order_items (order_id, product_id, price, qty, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [order.id, offer.product_id, unitPrice, qty],
      );
      let remainingOrderId: string | null = null;
      if (saldo > 0) {
        const [remaining] = await qr.query(
          `INSERT INTO orders (user_id, total_amount, shipping_cost, status, payment_stage, created_at, updated_at)
           VALUES ($1, $2, $3, 'pending_payment', 'saldo', NOW(), NOW()) RETURNING id, total_amount`,
          [userId, saldo, 0],
        );
        await qr.query(
          `INSERT INTO order_items (order_id, product_id, price, qty, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [remaining.id, offer.product_id, unitPrice, qty],
        );
        remainingOrderId = remaining.id;
      }
      await qr.query(
        `UPDATE request_offers SET estado = 'aceptada', order_id = $2, remaining_order_id = $4, garantia_pct = $5, aceptacion_variante = $3 WHERE id = $1`,
        [offerId, order.id, offer.es_variante, remainingOrderId, pct],
      );
      // Liberar la garantía de oferta del ganador (ya se compromete pagando la garantía de compromiso)
      if (Number(offer.garantia_oferta) > 0) {
        await qr.query(
          `UPDATE funds
           SET available_balance = available_balance + $2, pending_balance = GREATEST(pending_balance - $2, 0)
           WHERE user_id = $1`,
          [offer.seller_id, Number(offer.garantia_oferta)],
        );
        await qr.query(
          `UPDATE request_offers SET garantia_oferta_reservada = false, garantia_oferta = 0 WHERE id = $1`,
          [offerId],
        );
      }
      // Liberar garantías de oferta de las demás ofertas pendientes (rechazadas)
      const rechazadas = await qr.query(
        `SELECT id, seller_id, garantia_oferta FROM request_offers
         WHERE request_id = $1 AND id != $2 AND estado = 'pendiente' AND garantia_oferta_reservada = true`,
        [requestId, offerId],
      );
      await qr.query(
        `UPDATE request_offers SET estado = 'rechazada', garantia_oferta_reservada = false, garantia_oferta = 0
         WHERE request_id = $1 AND id != $2 AND estado = 'pendiente'`,
        [requestId, offerId],
      );
      for (const ro of rechazadas) {
        if (Number(ro.garantia_oferta) > 0) {
          await qr.query(
            `UPDATE funds
             SET available_balance = available_balance + $2, pending_balance = GREATEST(pending_balance - $2, 0)
             WHERE user_id = $1`,
            [ro.seller_id, Number(ro.garantia_oferta)],
          );
        }
      }
      await qr.query(`UPDATE buyer_requests SET estado = 'aceptada' WHERE id = $1`, [requestId]);
      await this.emitRequestUpdate(requestId, "aceptada");
      await qr.commitTransaction();

      // Notificaciones dirigidas: vendedor ganador y vendedores rechazados
      try {
        const tituloSolicitud = (req as any).title || "tu solicitud";
        this.gateway.notifyUser(offer.seller_id, {
          tipo: "oferta_aceptada",
          titulo: "¡Tu oferta fue aceptada!",
          mensaje: `"${tituloSolicitud}": el comprador aceptó tu oferta. Prepara el pedido.`,
          url: "/perfil/mis-ventas",
        });
        for (const ro of rechazadas) {
          if (ro.seller_id !== offer.seller_id) {
            this.gateway.notifyUser(ro.seller_id, {
              tipo: "oferta_rechazada",
              titulo: "Tu oferta no fue seleccionada",
              mensaje: `"${tituloSolicitud}": el comprador eligió otra oferta. Tu garantía de oferta fue liberada.`,
              url: "/perfil/ofertas",
            });
          }
        }
      } catch {}
      return {
        order_id: order.id,
        guarantee_amount: guarantee,
        remaining_order_id: remainingOrderId,
        remaining_amount: saldo,
        total_amount: total,
        garantia_pct: pct,
        message: `Oferta aceptada. Pagas la garantía de compromiso (${pct}% = S/ ${guarantee.toFixed(2)}) y luego el saldo (S/ ${saldo.toFixed(2)}) en Mis Compras.`,
      };
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async listSellerOffers(userId: string) {
    return this.dataSource.query(
      `SELECT ro.*,
         json_build_object('id', r.id, 'title', r.title, 'category_id', r.category_id,
           'precio_minimo', r.precio_minimo, 'precio_maximo', r.precio_maximo,
           'cantidad', r.cantidad, 'estado', r.estado, 'fecha_limite', r.fecha_limite, 'created_at', r.created_at) AS request,
         json_build_object('id', p.id, 'title', p.title, 'nivel_coincidencia', p.nivel_coincidencia) AS product
       FROM request_offers ro
       JOIN buyer_requests r ON r.id = ro.request_id
       LEFT JOIN products p ON p.id = ro.product_id
       WHERE ro.seller_id = $1
       ORDER BY ro.created_at DESC
       LIMIT 200`, [userId],
    );
  }

  // ─── Panel admin de solicitudes y ofertas ────────────────

  async findAllAdmin(status?: string, q?: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const clauses: string[] = [];
    const params: any[] = [];
    if (status) {
      params.push(status);
      clauses.push(`r.estado = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      clauses.push(`(r.title ILIKE $${params.length} OR r.description ILIKE $${params.length})`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    const [{ count }] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS count FROM buyer_requests r ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.dataSource.query(
      `SELECT r.*,
         (SELECT COUNT(*)::int FROM request_offers ro WHERE ro.request_id = r.id) AS offers_count,
         (SELECT COUNT(*)::int FROM request_offers ro WHERE ro.request_id = r.id AND ro.estado = 'aceptada') AS accepted_count,
         json_build_object('id', u.id, 'email', u.email,
           'first_name', up.first_name, 'last_name', up.last_name, 'phone', u.phone) AS buyer
       FROM buyer_requests r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN user_profiles up ON up.user_id = r.user_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { items: rows, total: Number(count), page, limit };
  }

  async findOffersAdmin(requestId: string) {
    const rows = await this.dataSource.query(
      `SELECT ro.*,
         json_build_object('id', u.id, 'email', u.email,
           'first_name', up.first_name, 'last_name', up.last_name, 'phone', u.phone) AS seller,
         json_build_object('id', p.id, 'title', p.title, 'nivel_coincidencia', p.nivel_coincidencia) AS product,
         json_build_object('id', r.id, 'title', r.title, 'category_id', r.category_id) AS request
       FROM request_offers ro
       LEFT JOIN users u ON u.id = ro.seller_id
       LEFT JOIN user_profiles up ON up.user_id = ro.seller_id
       LEFT JOIN products p ON p.id = ro.product_id
       LEFT JOIN buyer_requests r ON r.id = ro.request_id
       WHERE ro.request_id = $1
       ORDER BY ro.created_at ASC`,
      [requestId],
    );
    return rows;
  }

  // ─── Mantenimiento ──────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async expireOverdue() {
    try {
      const res = await this.dataSource.query(
        `UPDATE buyer_requests SET estado = 'expirada'
         WHERE estado = 'abierta' AND fecha_limite IS NOT NULL AND fecha_limite < NOW()
         RETURNING id`,
      );
      if (res.length) {
        const ids = res.map((r: any) => r.id);
        const pendientes = await this.dataSource.query(
          `SELECT id, seller_id, garantia_oferta FROM request_offers
           WHERE request_id = ANY($1) AND estado = 'pendiente' AND garantia_oferta_reservada = true`,
          [ids],
        );
        await this.dataSource.query(
          `UPDATE request_offers SET estado = 'rechazada', garantia_oferta_reservada = false, garantia_oferta = 0
           WHERE request_id = ANY($1) AND estado = 'pendiente'`, [ids],
        );
        for (const o of pendientes) {
          if (Number(o.garantia_oferta) > 0) {
            await this.dataSource.query(
              `UPDATE funds
               SET available_balance = available_balance + $2, pending_balance = GREATEST(pending_balance - $2, 0)
               WHERE user_id = $1`,
              [o.seller_id, Number(o.garantia_oferta)],
            );
          }
          // Notificación dirigida: la solicitud venció y su oferta fue descartada
          try {
            this.gateway.notifyUser(o.seller_id, {
              tipo: "oferta_expirada",
              titulo: "Solicitud expirada",
              mensaje: "La solicitud a la que ofertaste expiró. Tu garantía de oferta fue liberada.",
              url: "/perfil/ofertas",
            });
          } catch {}
        }
        console.log(`[Requests] ${res.length} solicitud(es) expirada(s)`);
        // Auditoría + notificación al iniciador (comprador) por cada solicitud expirada
        for (const r of res) {
          try {
            const [solicitud] = await this.dataSource.query(
              `SELECT user_id, title FROM buyer_requests WHERE id = $1`, [r.id],
            );
            this.audit.log({
              action: "request_expired_deserted",
              entity: "buyer_request",
              entityId: r.id,
              details: { titulo: solicitud?.title || null },
            });
            if (solicitud?.user_id) {
              this.gateway.notifyUser(solicitud.user_id, {
                tipo: "solicitud_expirada",
                titulo: "Solicitud expirada",
                mensaje: `"${solicitud?.title || "Solicitud"}": la solicitud expiró sin adjudicar.`,
                url: `/solicitudes/${r.id}`,
              });
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error("[Requests] Error expirando solicitudes:", e.message);
    }
  }

  /** Cancelación administrativa por irregularidades */
  async cancelByAdmin(requestId: string, actorId: string, motivo: string) {
    const req = await this.requestsRepo.findOne({ where: { id: requestId } });
    if (!req) throw new NotFoundException("Solicitud no encontrada");
    if (!["abierta", "expirada"].includes(req.estado)) throw new BadRequestException("Solo se pueden cancelar solicitudes abiertas o expiradas");

    // Rechazar ofertas pendientes y liberar garantías
    const pendientes = await this.dataSource.query(
      `SELECT id, seller_id, garantia_oferta FROM request_offers
       WHERE request_id = $1 AND estado = 'pendiente' AND garantia_oferta_reservada = true`,
      [requestId],
    );
    await this.dataSource.query(
      `UPDATE request_offers SET estado = 'rechazada', garantia_oferta_reservada = false, garantia_oferta = 0
       WHERE request_id = $1 AND estado = 'pendiente'`,
      [requestId],
    );
    for (const o of pendientes) {
      if (Number(o.garantia_oferta) > 0) {
        await this.dataSource.query(
          `INSERT INTO funds (user_id, available_balance, pending_balance, disputed_balance)
           VALUES ($1, $2, 0, 0)
           ON CONFLICT (user_id) DO UPDATE
           SET available_balance = funds.available_balance + $2,
               pending_balance = GREATEST(funds.pending_balance - $2, 0)`,
          [o.seller_id, Number(o.garantia_oferta)],
        );
      }
    }

    await this.requestsRepo.save({ ...req, estado: "cancelada" } as any);
    await this.emitRequestUpdate(requestId, "cancelada");

    // Auditoría
    this.audit.log({
      userId: actorId,
      action: "request_cancelled_irregularity",
      entity: "buyer_request",
      entityId: requestId,
      details: { titulo: req.title || null, motivo, ofertas_rechazadas: pendientes.length },
    });

    // Notificar al comprador
    try {
      this.gateway.notifyUser(req.user_id, {
        tipo: "solicitud_cancelada_admin",
        titulo: "Solicitud cancelada por administración",
        mensaje: `"${req.title || "Solicitud"}": tu solicitud fue cancelada por irregularidades. Motivo: ${motivo}.`,
        url: `/solicitudes/${requestId}`,
      });
    } catch {}

    return { message: "Solicitud cancelada por irregularidades. Ofertas y garantías procesadas." };
  }
}
