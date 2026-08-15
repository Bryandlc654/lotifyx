import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BuyerRequest } from "./entities/buyer-request.entity";
import { RequestOffer } from "./entities/request-offer.entity";
import { MatchingService } from "./matching.service";
import { ConfigService } from "../config/config.service";

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(BuyerRequest) private readonly requestsRepo: Repository<BuyerRequest>,
    @InjectRepository(RequestOffer) private readonly offersRepo: Repository<RequestOffer>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly matching: MatchingService,
    private readonly config: ConfigService,
  ) {}

  private num(v: any): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
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
    const req = this.requestsRepo.create({
      user_id: userId,
      category_id: dto.category_id,
      title,
      description: dto?.description ?? null,
      specifications: dto?.specifications && typeof dto.specifications === "object" ? dto.specifications : {},
      image: dto?.image ?? null,
      precio_minimo: this.num(dto?.precio_minimo),
      precio_maximo: this.num(dto?.precio_maximo),
      cantidad,
      fecha_limite: dto?.fecha_limite ? new Date(dto.fecha_limite) : null,
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
    if (dto?.cantidad !== undefined) req.cantidad = Math.max(1, Math.floor(this.num(dto.cantidad) ?? 1));
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
    await this.offersRepo.update({ request_id: id, estado: "pendiente" }, { estado: "rechazada" });
    return { message: "Solicitud cancelada" };
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
      regla: "estricta",
    };
  }

  // ─── Ofertas de los vendedores ──────────────────────────

  async makeOffer(userId: string, requestId: string, dto: any) {
    const req = await this.requestsRepo.findOne({ where: { id: requestId } });
    if (!req) throw new NotFoundException("Solicitud no encontrada");
    if (req.estado !== "abierta") throw new BadRequestException("La solicitud ya no acepta ofertas");
    if (req.user_id === userId) throw new ForbiddenException("No puedes ofertar en tu propia solicitud");

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

    // Coincidencia de producto (regla base de la demanda: estricta)
    const fields = await this.dataSource.query(
      `SELECT name, label, grupo FROM category_fields WHERE category_id = $1`, [req.category_id],
    );
    const match = this.matching.calcularCoincidencia(p.specifications, req.specifications, fields);
    const requiereVariante = match.nivel !== "estricta";
    if (requiereVariante && !Boolean(dto?.es_variante)) {
      const detalle = match.faltantes.length
        ? `faltan: ${match.faltantes.map(d => d.label).join(", ")}`
        : `varía: ${match.variantes.map(d => d.label).join(", ")}`;
      throw new BadRequestException(
        `Tu producto no coincide estrictamente con la solicitud (${detalle}). ` +
        `Márcalo como variante para ofertarlo y el comprador deberá aceptarlo expresamente.`,
      );
    }
    if (requiereVariante && !String(dto?.mensaje || "").trim()) {
      throw new BadRequestException("Al ofrecer una variante debes explicar en un mensaje en qué se diferencia");
    }

    const existing = await this.offersRepo.findOne({
      where: { request_id: requestId, seller_id: userId, estado: "pendiente" },
    });
    if (existing) throw new BadRequestException("Ya tienes una oferta pendiente en esta solicitud");

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
      es_variante: requiereVariante,
      coincidencia: match.nivel,
      garantia_pct: garantiaPct,
    });
    await this.offersRepo.save(offer);
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

    const pct = offer.garantia_pct ?? (await this.config.getPct("garantia_subasta_inversa_pct"));
    const guarantee = Number((total * pct / 100).toFixed(2));
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
      await qr.query(
        `UPDATE request_offers SET estado = 'rechazada' WHERE request_id = $1 AND id != $2 AND estado = 'pendiente'`,
        [requestId, offerId],
      );
      await qr.query(`UPDATE buyer_requests SET estado = 'aceptada' WHERE id = $1`, [requestId]);
      await qr.commitTransaction();
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
        await this.dataSource.query(
          `UPDATE request_offers SET estado = 'rechazada' WHERE request_id = ANY($1) AND estado = 'pendiente'`, [ids],
        );
        console.log(`[Requests] ${res.length} solicitud(es) expirada(s)`);
      }
    } catch (e) {
      console.error("[Requests] Error expirando solicitudes:", e.message);
    }
  }
}
