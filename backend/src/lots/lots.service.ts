import { Injectable, NotFoundException, BadRequestException, ForbiddenException, OnModuleInit } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { DataSource } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { LotSale } from "./lot-sale.entity";
import { LotParticipant } from "./lot-participant.entity";
import { LotRcgTier } from "./lot-rcg-tier.entity";
import { LotBenefitApplication } from "./lot-benefit-application.entity";
import { ConfigService } from "../config/config.service";
import { CollusionService } from "../collusion/collusion.service";
import { GuaranteesService } from "../guarantees/guarantees.service";
import { MessagesGateway } from "../messages/messages.gateway";
import { AuditService } from "../audit/audit.service";

const LOT_SELECT = `
  l.id, l.product_id, l.vendedor_id, l.precio_lote, l.precio_individual,
  l.participantes_minimos, l.cmc, l.cantidad_total, l.cantidad_reservada,
  l.meta_venta, l.destacado, l.divisible,
  l.fecha_cierre, l.estado, l.created_at, l.updated_at,
  COALESCE((SELECT SUM(lp.cantidad) FROM lot_participants lp
            WHERE lp.lot_sale_id = l.id AND lp.estado = 'reservado'), 0) AS cantidad_reservada_calc,
  (SELECT COUNT(*) FROM lot_participants lp
   WHERE lp.lot_sale_id = l.id AND lp.estado = 'reservado') AS participantes_count,
  COALESCE(
    (SELECT json_agg(json_build_object(
       'id', t.id, 'desde', t.desde, 'hasta', t.hasta,
       'tipo_beneficio', t.tipo_beneficio, 'valor', t.valor,
       'activacion', t.activacion, 'descripcion', t.descripcion)
     ORDER BY t.desde ASC)
     FROM lot_rcg_tiers t WHERE t.lot_sale_id = l.id),
    '[]'::json) AS rcg_tiers,
  p.title AS product_title, p.specifications AS product_specifications,
  p.sku AS product_sku, p.status AS product_status, p.stock AS product_stock,
  up.first_name AS vendedor_first_name, up.last_name AS vendedor_last_name,
  u.email AS vendedor_email
`;

@Injectable()
export class LotsService implements OnModuleInit {
  constructor(
    @InjectRepository(LotSale)
    private readonly repo: Repository<LotSale>,
    @InjectRepository(LotParticipant)
    private readonly participantsRepo: Repository<LotParticipant>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly collusion: CollusionService,
    private readonly guarantees: GuaranteesService,
    private readonly gateway: MessagesGateway,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    try {
      // Crear registros de lote faltantes para productos existentes
      const missing = await this.dataSource.query(
         `SELECT p.id, p.user_id, p.precio_lote, p.precio_individual,
                 COALESCE(p.participantes_minimos, 1) AS participantes_minimos,
                 COALESCE(p.cmc, 1) AS cmc,
                 COALESCE(p.cantidad_total, 1) AS cantidad_total,
                 p.cierre_estimado, p.status
          FROM products p
         LEFT JOIN lot_sales l ON l.product_id = p.id
         WHERE p.metodo_pago = 'venta_por_lote' AND l.id IS NULL`
      );
      for (const p of missing) {
        if (!p.precio_lote || Number(p.precio_lote) <= 0) continue;
        const estado = p.status === "active" ? "abierto" : "pendiente";
        await this.dataSource.query(
          `INSERT INTO lot_sales (product_id, vendedor_id, precio_lote, precio_individual, participantes_minimos, cmc, cantidad_total, fecha_cierre, estado)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (product_id) DO NOTHING`,
          [p.id, p.user_id, p.precio_lote, p.precio_individual || 0,
           p.participantes_minimos, p.cmc,
           p.cantidad_total,
           p.cierre_estimado ? new Date(p.cierre_estimado) : null, estado]
        );
      }
      if (missing.length > 0) {
        console.log(`[Lot] ${missing.length} registro(s) de lote faltante(s) creado(s)`);
      }

      await this.syncTotals();

      const closed = await this.closeExpired();
      if (closed > 0) {
        console.log(`[Lot] ${closed} lote(s) cerrado(s)/cancelado(s) al iniciar`);
      }
    } catch (e: any) {
      console.error("[Lot] Error en onModuleInit:", e.message);
    }
  }

  private async reservedOf(lotSaleId: string): Promise<number> {
    const [row] = await this.dataSource.query(
      `SELECT COALESCE(SUM(cantidad), 0) AS total FROM lot_participants
       WHERE lot_sale_id = $1 AND estado = 'reservado'`,
      [lotSaleId],
    );
    return Number(row?.total || 0);
  }

  async findOpen() {
    await this.closeExpired();
    const rows = await this.dataSource.query(
      `SELECT ${LOT_SELECT}
       FROM lot_sales l
       JOIN products p ON p.id = l.product_id AND p.deleted_at IS NULL
       LEFT JOIN users u ON u.id = l.vendedor_id
       LEFT JOIN user_profiles up ON up.user_id = l.vendedor_id
       WHERE l.estado = 'abierto'
       ORDER BY l.created_at DESC`
    );
    return rows.map((r: any) => this.serialize(r));
  }

  async findByProduct(productId: string, userId?: string) {
    await this.closeExpired();
    const [row] = await this.dataSource.query(
      `SELECT ${LOT_SELECT}
       FROM lot_sales l
       JOIN products p ON p.id = l.product_id AND p.deleted_at IS NULL
       LEFT JOIN users u ON u.id = l.vendedor_id
       LEFT JOIN user_profiles up ON up.user_id = l.vendedor_id
       WHERE l.product_id = $1`,
      [productId],
    );
    if (!row) return null;

    const participants = await this.dataSource.query(
      `SELECT lp.id, lp.lot_sale_id, lp.comprador_id, lp.cantidad, lp.estado, lp.order_id, lp.garantia_pagada, lp.created_at,
              up.first_name AS comprador_first_name, up.last_name AS comprador_last_name
       FROM lot_participants lp
       LEFT JOIN user_profiles up ON up.user_id = lp.comprador_id
       WHERE lp.lot_sale_id = $1
       ORDER BY lp.created_at ASC`,
      [row.id],
    );

    const lot = this.serialize(row);
    lot.participants = participants.map((p: any) => ({
      ...p,
      comprador_first_name: p.comprador_first_name || "",
      comprador_last_name: p.comprador_last_name || "",
    }));
    if (userId) {
      lot.my_participant = participants.find((p: any) => p.comprador_id === userId) || null;
    }
    return lot;
  }

  async create(dto: {
    product_id: string;
    vendedor_id: string;
    precio_lote: number;
    precio_individual: number;
    participantes_minimos?: number;
    cmc?: number;
    cantidad_total?: number;
    fecha_cierre?: string;
  }) {
    const existing = await this.repo.findOne({ where: { product_id: dto.product_id } });
    if (existing) throw new BadRequestException("Este producto ya tiene una venta por lote activa");

    const cantidad_total = Math.max(1, Math.floor(Number(dto.cantidad_total) || 1));
    const participantes_minimos = Math.min(
      Math.max(1, Math.floor(Number(dto.participantes_minimos) || 1)),
      cantidad_total,
    );
    const cmc = Math.min(
      Math.max(1, Math.floor(Number(dto.cmc) || 1)),
      cantidad_total,
    );

    const data: any = {
      product_id: dto.product_id,
      vendedor_id: dto.vendedor_id,
      precio_lote: dto.precio_lote,
      precio_individual: dto.precio_individual,
      participantes_minimos,
      cmc,
      cantidad_total,
      estado: "pendiente",
    };
    if (dto.fecha_cierre) data.fecha_cierre = new Date(dto.fecha_cierre);
    return this.repo.save(this.repo.create(data));
  }

  async join(lotSaleId: string, compradorId: string, cantidad: number = 1) {
    // Compradores bloqueados o sancionados no pueden participar
    await this.collusion.assertNotBlocked(compradorId);
    await this.collusion.assertNotSanctioned(compradorId);

    const lot = await this.repo.findOne({ where: { id: lotSaleId } });
    if (!lot) throw new NotFoundException("Venta por lote no encontrada");
    if (lot.estado !== "abierto") throw new BadRequestException("Esta venta por lote ya cerró");
    if (lot.vendedor_id === compradorId) throw new BadRequestException("No puedes unirte a tu propio lote");

    const qty = Math.floor(Number(cantidad));
    if (!qty || qty < 1) throw new BadRequestException("Ingresa una cantidad válida");

    // Lote indivisible: cada participante compromete 1 unidad
    const effectiveQty = lot.divisible === false ? 1 : qty;
    if (lot.divisible === false && qty > 1) {
      throw new BadRequestException("Este lote es indivisible: cada participante solo puede comprometer 1 unidad");
    }

    const cmc = Math.max(1, lot.cmc || 1);
    if (effectiveQty < cmc) {
      throw new BadRequestException(`Debes comprometer al menos ${cmc} unidad(es) (CMC)`);
    }

    // Transacción con bloqueo de fila del lote: evita que dos compradores simultáneos
    // superen el volumen comprometido (atomicidad de la reserva)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let totalReserved = 0;
    let lotTotal = Math.max(1, lot.cantidad_total || 1);
    try {
      await queryRunner.query(`SELECT id FROM lot_sales WHERE id = $1 FOR UPDATE`, [lotSaleId]);

      // El lote nunca puede superar el stock real del producto
      const [prodRow] = await queryRunner.query(
        `SELECT stock FROM products WHERE id = $1 FOR UPDATE`,
        [lot.product_id],
      );
      const productStock = Number(prodRow?.stock || 0);
      const cantidadTotal = productStock > 0 ? Math.min(lotTotal, productStock) : lotTotal;
      if (effectiveQty > cantidadTotal) {
        throw new BadRequestException(`La cantidad máxima disponible es ${cantidadTotal} unidad(es)`);
      }

      const [reservedRow] = await queryRunner.query(
        `SELECT COALESCE(SUM(cantidad), 0)::int AS reserved FROM lot_participants
         WHERE lot_sale_id = $1 AND estado = 'reservado'`,
        [lotSaleId],
      );
      const reserved = Number(reservedRow?.reserved || 0);

      const existing = await queryRunner.query(
        `SELECT * FROM lot_participants WHERE lot_sale_id = $1 AND comprador_id = $2`,
        [lotSaleId, compradorId],
      );
      const current = existing[0];
      const currentQty = current && current.estado === "reservado" ? Number(current.cantidad) || 0 : 0;

      totalReserved = reserved - currentQty + effectiveQty;
      if (totalReserved > cantidadTotal) {
        const disponible = cantidadTotal - (reserved - currentQty);
        throw new BadRequestException(
          disponible <= 0
            ? "El lote ya no tiene unidades disponibles"
            : `Solo quedan ${disponible} unidad(es) disponible(s) en el lote`
        );
      }

      if (current) {
        if (current.estado !== "reservado") {
          throw new BadRequestException("Ya participaste en este lote");
        }
        await queryRunner.query(
          `UPDATE lot_participants SET cantidad = $2 WHERE id = $1`,
          [current.id, effectiveQty],
        );
      } else {
        await queryRunner.query(
          `INSERT INTO lot_participants (lot_sale_id, comprador_id, cantidad, estado, created_at)
           VALUES ($1, $2, $3, 'reservado', NOW())`,
          [lotSaleId, compradorId, effectiveQty],
        );
      }

      await queryRunner.query(
        `UPDATE lot_sales SET cantidad_reservada = $2, updated_at = NOW() WHERE id = $1`,
        [lotSaleId, totalReserved],
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    const minUnits = Math.max(1, lot.participantes_minimos || 1);
    const reachMinimo = totalReserved >= minUnits;
    const reachTotal = totalReserved >= lotTotal;
    if (reachMinimo || reachTotal) {
      await this.closeLot(lotSaleId);
      await this.emitLotUpdate(lotSaleId);
      return { message: "Lote completado. Se generó tu orden de compra; confirma el pago en Mis Compras.", lot_cerrado: true, lot_id: lotSaleId };
    }

    await this.emitLotUpdate(lotSaleId);
    return {
      message: "Te uniste al lote. La reserva queda pendiente hasta completar el mínimo.",
      lot_cerrado: false,
      lot_id: lotSaleId,
    };
  }

  /** Emite en tiempo real el volumen comprometido, umbral y RCG vigente del lote (demanda agregada) */
  private async emitLotUpdate(lotSaleId: string) {
    try {
      const [row] = await this.dataSource.query(
        `SELECT l.product_id, l.cantidad_reservada, l.participantes_minimos, l.estado, l.meta_venta, l.cantidad_total,
                (SELECT COUNT(*)::int FROM lot_participants lp WHERE lp.lot_sale_id = l.id AND lp.estado = 'reservado') AS participantes_count
         FROM lot_sales l WHERE l.id = $1`,
        [lotSaleId],
      );
      if (row) {
        const reserved = Number(row.cantidad_reservada) || 0;
        const metaVenta = row.meta_venta != null ? Number(row.meta_venta) : null;
        const base = metaVenta || Number(row.cantidad_total) || 0;
        // Porcentaje de demanda vigente: cobertura de la meta de venta (o cantidad total como respaldo)
        const pctDemanda = base > 0 ? Math.round((reserved / base) * 1000) / 10 : 0;
        // Marcar el UA alcanzado al superar el % de demanda vigente configurado (por defecto 70)
        const umbralPct = await this.config.getPct("demanda_agregada_pct").catch(() => 70);
        const uaAlcanzado = base > 0 && pctDemanda >= umbralPct;
        let tierActual: any = null;
        try {
          const tiers = await this.dataSource.query(
            `SELECT * FROM lot_rcg_tiers WHERE lot_sale_id = $1`, [lotSaleId],
          );
          const cierreTier = this.pickCierreTier(tiers, reserved);
          if (cierreTier) {
            tierActual = {
              id: cierreTier.id,
              desde: cierreTier.desde,
              hasta: cierreTier.hasta,
              tipo_beneficio: cierreTier.tipo_beneficio,
              valor: Number(cierreTier.valor),
              descripcion: cierreTier.descripcion,
            };
          }
        } catch {}
        this.gateway.notifyLotUpdate(row.product_id, {
          cantidad_reservada: reserved,
          participantes_count: Number(row.participantes_count) || 0,
          umbral: Number(row.participantes_minimos) || 0,
          estado: row.estado,
          meta_venta: metaVenta,
          cantidad_total: Number(row.cantidad_total) || 0,
          porcentaje_demanda_vigente: pctDemanda,
          ua_alcanzado: uaAlcanzado,
          tier_actual: tierActual,
          expectativa_superada: metaVenta != null && reserved >= metaVenta,
        });
      }
    } catch {}
  }

  async getParticipants(lotSaleId: string) {
    await this.closeExpired();
    return this.dataSource.query(
      `SELECT lp.id, lp.lot_sale_id, lp.comprador_id, lp.cantidad, lp.estado, lp.order_id, lp.garantia_pagada, lp.created_at,
              up.first_name AS comprador_first_name, up.last_name AS comprador_last_name
       FROM lot_participants lp
       LEFT JOIN user_profiles up ON up.user_id = lp.comprador_id
       WHERE lp.lot_sale_id = $1
       ORDER BY lp.created_at ASC`,
      [lotSaleId],
    );
  }

  async getMyLots(vendedorId: string) {
    const rows = await this.dataSource.query(
      `SELECT ${LOT_SELECT}
       FROM lot_sales l
       JOIN products p ON p.id = l.product_id AND p.deleted_at IS NULL
       LEFT JOIN users u ON u.id = l.vendedor_id
       LEFT JOIN user_profiles up ON up.user_id = l.vendedor_id
       WHERE l.vendedor_id = $1
       ORDER BY l.created_at DESC`,
      [vendedorId],
    );
    return rows.map((r: any) => this.serialize(r));
  }

  /** Devuelve lotes serializados por ids (para detalle administrativo) */
  async getLotsRaw(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    const rows = await this.dataSource.query(
      `SELECT ${LOT_SELECT}
       FROM lot_sales l
       JOIN products p ON p.id = l.product_id AND p.deleted_at IS NULL
       LEFT JOIN users u ON u.id = l.vendedor_id
       LEFT JOIN user_profiles up ON up.user_id = l.vendedor_id
       WHERE l.id = ANY($1)
       ORDER BY l.created_at DESC`,
      [ids],
    );
    return rows.map((r: any) => this.serialize(r));
  }

  /** Cierra el lote: confirma participantes y genera una orden (pending_payment) por cada reserva.
   *  Aplica los beneficios RCG activos (al_cmc por comprador, al_cierre y superar_expectativa al grupo)
   *  y deja la traza en lot_benefit_applications. */
  async closeLot(lotSaleId: string) {
    const lot = await this.repo.findOne({ where: { id: lotSaleId } });
    if (!lot) throw new NotFoundException("Venta por lote no encontrada");
    if (lot.estado === "cerrado") return lot;

    const tiers: any[] = await this.dataSource.query(
      `SELECT * FROM lot_rcg_tiers WHERE lot_sale_id = $1 ORDER BY desde ASC`,
      [lotSaleId],
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(
        `UPDATE lot_sales SET estado = 'cerrado', updated_at = NOW() WHERE id = $1`,
        [lotSaleId],
      );
      const participants = await queryRunner.query(
        `SELECT id, comprador_id, cantidad FROM lot_participants
         WHERE lot_sale_id = $1 AND estado = 'reservado' AND order_id IS NULL`,
        [lotSaleId],
      );

      const reserved = participants.reduce((sum: number, p: any) => sum + (Number(p.cantidad) || 0), 0);
      const cierreTier = this.pickCierreTier(tiers, reserved);
      const expectativaTier = this.pickExpectativaTier(tiers, lot, reserved);
      const destacado =
        cierreTier?.tipo_beneficio === "destaque" ||
        expectativaTier?.tipo_beneficio === "destaque" ||
        (tiers.find((t: any) => t.activacion === "al_cmc" && t.tipo_beneficio === "destaque") && participants.some((p: any) => Number(p.cantidad) >= this.cmcOf(lot)));
      if (destacado) {
        await queryRunner.query(
          `UPDATE lot_sales SET destacado = TRUE WHERE id = $1`,
          [lotSaleId],
        );
      }

      const basePrice = Number(lot.precio_individual || 0);
      const cmcMin = this.cmcOf(lot);
      const [prodCat] = await queryRunner.query(`SELECT category_id FROM products WHERE id = $1`, [lot.product_id]);
      const categoriaId = prodCat?.category_id || null;

      for (const p of participants) {
        const cantidad = Math.max(1, Number(p.cantidad) || 1);
        const cmcTier = cantidad >= cmcMin ? this.pickCmcTier(tiers, cantidad) : null;
        const applied = [cmcTier, cierreTier, expectativaTier].filter(Boolean);

        let unitPrice = basePrice;
        for (const t of applied) {
          unitPrice = this.applyBenefit(unitPrice, t);
        }

        const fleteTier = (applied as any[]).find((t: any) => t.tipo_beneficio === "flete");
        const shippingCost = fleteTier ? Number(fleteTier.valor || 0) : 0;
        const itemsTotal = unitPrice * cantidad;
        const total = itemsTotal + shippingCost;
        const calc = await this.guarantees.calcular({ canal: "demanda_agregada", categoriaId, base: total });
        const guarantee = calc.monto;
        const garantiaPct = calc.pct_aplicado;
        const saldo = Number((total - guarantee).toFixed(2));

        const [order] = await queryRunner.query(
          `INSERT INTO orders (user_id, total_amount, shipping_cost, status, payment_stage, created_at, updated_at)
           VALUES ($1, $2, $3, 'pending_payment', 'garantia', NOW(), NOW())
           RETURNING id`,
          [p.comprador_id, guarantee, shippingCost],
        );
        await queryRunner.query(
          `INSERT INTO order_items (order_id, product_id, price, qty, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [order.id, lot.product_id, unitPrice, cantidad],
        );
        let remainingOrderId: string | null = null;
        if (saldo > 0) {
          const [remaining] = await queryRunner.query(
            `INSERT INTO orders (user_id, total_amount, shipping_cost, status, payment_stage, created_at, updated_at)
             VALUES ($1, $2, $3, 'pending_payment', 'saldo', NOW(), NOW())
             RETURNING id`,
            [p.comprador_id, saldo, 0],
          );
          await queryRunner.query(
            `INSERT INTO order_items (order_id, product_id, price, qty, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [remaining.id, lot.product_id, unitPrice, cantidad],
          );
          remainingOrderId = remaining.id;
        }
        await queryRunner.query(
          `UPDATE lot_participants SET order_id = $2, remaining_order_id = $3, garantia_pct = $4 WHERE id = $1`,
          [p.id, order.id, remainingOrderId, garantiaPct],
        );

        const seenTiers = new Set<string>();
        for (const t of applied as any[]) {
          if (!t || seenTiers.has(t.id)) continue;
          seenTiers.add(t.id);
          await queryRunner.query(
            `INSERT INTO lot_benefit_applications
               (lot_sale_id, tier_id, comprador_id, lot_participant_id, order_id,
                beneficio_aplicado, monto, unidades_extra, estado, applied_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'aplicado', NOW())`,
            [
              lotSaleId, t.id, p.comprador_id, p.id, order.id,
              this.benefitText(t),
              this.benefitAmount(t, basePrice, cantidad),
              t.tipo_beneficio === "unidades_extra" ? Number(t.valor || 0) : 0,
            ],
          );
        }
      }

      await queryRunner.query(
        `UPDATE lot_participants SET estado = 'confirmado'
         WHERE lot_sale_id = $1 AND estado = 'reservado'`,
        [lotSaleId],
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    lot.estado = "cerrado";
    await this.emitLotUpdate(lotSaleId);

    // Notificación dirigida: umbral alcanzado → participantes y vendedor afectados
    try {
      const [prod] = await this.dataSource.query(
        `SELECT title FROM products WHERE id = $1`, [lot.product_id],
      );
      const tituloProd = prod?.title || "Lote";
      const reservado = Number(lot.cantidad_reservada) || 0;
      const partes = await this.dataSource.query(
        `SELECT DISTINCT comprador_id FROM lot_participants WHERE lot_sale_id = $1 AND estado = 'confirmado'`,
        [lotSaleId],
      );
      const destinatarios = new Set<string>(partes.map((p: any) => p.comprador_id));
      destinatarios.add(lot.vendedor_id);
      for (const uid of destinatarios) {
        this.gateway.notifyUser(uid, {
          tipo: "umbral_alcanzado",
          titulo: "Umbral del lote alcanzado",
          mensaje: `"${tituloProd}": el lote cerró exitosamente con ${reservado} unidad(es) comprometida(s). Revisa tus pedidos.`,
          url: `/producto/${lot.product_id}`,
        });
      }
    } catch {}

    return lot;
  }

  private cmcOf(lot: LotSale): number {
    return Math.max(1, Number(lot.cmc) || 1);
  }

  private pickCmcTier(tiers: any[], cantidad: number): any | null {
    const reach = tiers
      .filter((t: any) => t.activacion === "al_cmc" && cantidad >= Number(t.desde || 0))
      .sort((a: any, b: any) => Number(b.desde) - Number(a.desde));
    return reach[0] || null;
  }

  private pickCierreTier(tiers: any[], reserved: number): any | null {
    const reach = tiers
      .filter(
        (t: any) =>
          t.activacion === "al_cierre" &&
          reserved >= Number(t.desde || 0) &&
          (t.hasta == null || t.hasta === "" || reserved <= Number(t.hasta)),
      )
      .sort((a: any, b: any) => Number(b.desde) - Number(a.desde));
    return reach[0] || null;
  }

  private pickExpectativaTier(tiers: any[], lot: LotSale, reserved: number): any | null {
    const threshold = Number(lot.meta_venta) || Number(lot.cantidad_total) || 0;
    if (threshold <= 0) return null;
    const reach = tiers
      .filter(
        (t: any) =>
          t.activacion === "superar_expectativa" &&
          reserved >= threshold &&
          reserved >= Number(t.desde || 0) &&
          (t.hasta == null || t.hasta === "" || reserved <= Number(t.hasta)),
      )
      .sort((a: any, b: any) => Number(b.desde) - Number(a.desde));
    return reach[0] || null;
  }

  private applyBenefit(price: number, tier: any): number {
    if (tier.tipo_beneficio === "precio") return Number(tier.valor || 0);
    if (tier.tipo_beneficio === "descuento") return price * (1 - Number(tier.valor || 0) / 100);
    return price;
  }

  private benefitText(tier: any): string {
    switch (tier.tipo_beneficio) {
      case "precio":
        return `Precio de S/ ${Number(tier.valor || 0).toFixed(2)} por unidad`;
      case "descuento":
        return `Descuento del ${Number(tier.valor || 0)}%`;
      case "flete":
        return Number(tier.valor || 0) > 0
          ? `Flete por S/ ${Number(tier.valor || 0).toFixed(2)}`
          : "Flete gratis";
      case "unidades_extra":
        return `+${Number(tier.valor || 0)} unidad(es) adicional(es)`;
      case "destaque":
        return "Compra destacada";
      case "cashback":
        return `Cashback del ${Number(tier.valor || 0)}%`;
      default:
        return tier.descripcion || "Beneficio especial";
    }
  }

  private benefitAmount(tier: any, basePrice: number, cantidad: number): number {
    switch (tier.tipo_beneficio) {
      case "precio":
        return Math.max(0, (basePrice - Number(tier.valor || 0)) * cantidad);
      case "descuento":
        return (basePrice * Number(tier.valor || 0) / 100) * cantidad;
      case "flete":
        return Number(tier.valor || 0);
      case "cashback":
        return (basePrice * Number(tier.valor || 0) / 100) * cantidad;
      default:
        return 0;
    }
  }

  /** Reemplaza los rangos RCG del lote (solo mientras sigue abierto/pendiente) */
  async savePricing(
    lotSaleId: string,
    tiers: Array<{
      desde?: number;
      hasta?: number | null;
      tipo_beneficio?: string;
      valor?: number;
      activacion?: string;
      descripcion?: string;
    }>,
    meta_venta?: number | null,
    actorId?: string,
  ) {
    const lot = await this.repo.findOne({ where: { id: lotSaleId } });
    if (!lot) throw new NotFoundException("Venta por lote no encontrada");
    if (lot.estado !== "abierto" && lot.estado !== "pendiente") {
      throw new BadRequestException("El lote ya cerró; no se pueden editar sus rangos");
    }
    if (actorId && lot.vendedor_id !== actorId) {
      throw new ForbiddenException("No puedes modificar los rangos de este lote");
    }

    const validTipos = ["precio", "descuento", "flete", "unidades_extra", "destaque", "otro", "cashback"];
    const validActivaciones = ["al_cmc", "al_cierre", "superar_expectativa"];

    const clean = (Array.isArray(tiers) ? tiers : [])
      .map((t: any) => ({
        desde: Math.max(1, Math.floor(Number(t.desde) || 1)),
        hasta: t.hasta != null && t.hasta !== "" ? Math.max(Math.floor(Number(t.hasta) || 0), Math.floor(Number(t.desde) || 1)) : null,
        tipo_beneficio: validTipos.includes(t.tipo_beneficio) ? t.tipo_beneficio : "descuento",
        valor: Math.max(0, Number(t.valor) || 0),
        activacion: validActivaciones.includes(t.activacion) ? t.activacion : "al_cierre",
        descripcion: typeof t.descripcion === "string" ? t.descripcion.trim() || null : null,
      }))
      .filter((t: any) => !t.hasta || t.hasta >= t.desde);

    if (clean.length === 0) {
      await this.dataSource.query(`DELETE FROM lot_rcg_tiers WHERE lot_sale_id = $1`, [lotSaleId]);
      if (meta_venta !== undefined) {
        const mv = meta_venta == null ? null : Math.max(1, Math.floor(Number(meta_venta) || 0));
        await this.dataSource.query(`UPDATE lot_sales SET meta_venta = $2 WHERE id = $1`, [lotSaleId, mv]);
      }
      return this.getTiers(lotSaleId);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`DELETE FROM lot_rcg_tiers WHERE lot_sale_id = $1`, [lotSaleId]);
      for (const t of clean) {
        await queryRunner.query(
          `INSERT INTO lot_rcg_tiers (lot_sale_id, desde, hasta, tipo_beneficio, valor, activacion, descripcion, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [lotSaleId, t.desde, t.hasta, t.tipo_beneficio, t.valor, t.activacion, t.descripcion],
        );
      }
      if (meta_venta !== undefined) {
        const mv = meta_venta == null ? null : Math.max(1, Math.floor(Number(meta_venta) || 0));
        await queryRunner.query(`UPDATE lot_sales SET meta_venta = $2 WHERE id = $1`, [lotSaleId, mv]);
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return this.getTiers(lotSaleId);
  }

  async getTiers(lotSaleId: string) {
    const rows = await this.dataSource.query(
      `SELECT id, lot_sale_id, desde, hasta, tipo_beneficio, valor, activacion, descripcion, created_at, updated_at
       FROM lot_rcg_tiers WHERE lot_sale_id = $1 ORDER BY desde ASC`,
      [lotSaleId],
    );
    return rows.map((r: any) => ({ ...r, valor: Number(r.valor) }));
  }

  async getBenefitApplications(lotSaleId: string) {
    return this.dataSource.query(
      `SELECT ba.id, ba.lot_sale_id, ba.tier_id, ba.comprador_id, ba.lot_participant_id, ba.order_id,
              ba.beneficio_aplicado, ba.monto, ba.unidades_extra, ba.estado, ba.applied_at,
              t.tipo_beneficio, t.desde, t.hasta, t.activacion, t.valor AS tier_valor,
              up.first_name AS comprador_first_name, up.last_name AS comprador_last_name
       FROM lot_benefit_applications ba
       LEFT JOIN lot_rcg_tiers t ON t.id = ba.tier_id
       LEFT JOIN user_profiles up ON up.user_id = ba.comprador_id
       WHERE ba.lot_sale_id = $1
       ORDER BY ba.applied_at DESC`,
      [lotSaleId],
    );
  }

  async cancelLot(lotSaleId: string) {
    const lot = await this.repo.findOne({ where: { id: lotSaleId } });
    if (!lot) throw new NotFoundException("Venta por lote no encontrada");

    // Devolver garantías pagadas a los participantes antes de cancelar
    const participants = await this.dataSource.query(
      `SELECT comprador_id, COALESCE(garantia_pagada, 0) AS garantia_pagada
       FROM lot_participants WHERE lot_sale_id = $1 AND estado = 'reservado' AND garantia_pagada > 0`,
      [lotSaleId],
    );
    for (const p of participants) {
      await this.dataSource.query(
        `INSERT INTO funds (user_id, available_balance, pending_balance, disputed_balance)
         VALUES ($1, $2, 0, 0)
         ON CONFLICT (user_id) DO UPDATE
         SET available_balance = funds.available_balance + $2,
             pending_balance = GREATEST(funds.pending_balance - $2, 0)`,
        [p.comprador_id, Number(p.garantia_pagada)],
      );
    }

    lot.estado = "cancelado";
    await this.repo.save(lot);
    await this.dataSource.query(
      `UPDATE lot_participants SET estado = 'cancelado' WHERE lot_sale_id = $1 AND estado = 'reservado'`,
      [lotSaleId],
    );

    // Auditoría + notificación al vendedor: lote desierto (no alcanzó el mínimo)
    const reservado = Number(lot.cantidad_reservada) || 0;
    const minimo = Number(lot.participantes_minimos) || 1;
    this.audit.log({
      action: "lot_closed_deserted",
      entity: "lot",
      entityId: lotSaleId,
      details: { product_id: lot.product_id, reservado, minimo, garantias_devueltas: participants.length },
    });
    try {
      const [prod] = await this.dataSource.query(`SELECT title FROM products WHERE id = $1`, [lot.product_id]);
      this.gateway.notifyUser(lot.vendedor_id, {
        tipo: "lote_cancelado",
        titulo: "Lote no alcanzó el mínimo",
        mensaje: `"${prod?.title || "Lote"}": el lote canceló con ${reservado}/${minimo} unidad(es). Garantías devueltas a ${participants.length} participante(s).`,
        url: `/producto/${lot.product_id}`,
      });
    } catch {}

    return lot;
  }

  /** Cancelación administrativa por irregularidades: cierra lote y devuelve garantías */
  async cancelForIrregularity(lotSaleId: string, actorId: string, motivo: string) {
    const lot = await this.repo.findOne({ where: { id: lotSaleId } });
    if (!lot) throw new NotFoundException("Venta por lote no encontrada");
    if (lot.estado !== "abierto") throw new BadRequestException("Solo se pueden cancelar lotes abiertos");

    await this.cancelLot(lotSaleId);

    // Auditoría adicional de cancelación administrativa
    this.audit.log({
      userId: actorId,
      action: "lot_cancelled_irregularity",
      entity: "lot",
      entityId: lotSaleId,
      details: { product_id: lot.product_id, motivo },
    });

    // Notificación adicional al vendedor
    try {
      const [prod] = await this.dataSource.query(`SELECT title FROM products WHERE id = $1`, [lot.product_id]);
      this.gateway.notifyUser(lot.vendedor_id, {
        tipo: "lote_cancelado_admin",
        titulo: "Lote cancelado por administración",
        mensaje: `"${prod?.title || "Lote"}": el lote fue cancelado por irregularidades. Motivo: ${motivo}.`,
        url: `/producto/${lot.product_id}`,
      });
    } catch {}

    return { message: "Lote cancelado por irregularidades. Garantías devueltas." };
  }

  /** Cierra lotes abiertos cuya fecha de cierre ya pasó: cierra si alcanzó el mínimo, si no cancela */
  @Cron(CronExpression.EVERY_MINUTE)
  async closeExpired() {
    await this.syncTotals();
    let processed = 0;
    const expired = await this.repo.find({
      where: { estado: "abierto", fecha_cierre: LessThan(new Date()) },
      order: { fecha_cierre: "ASC" },
      take: 100,
    });
    for (const lot of expired) {
      try {
        const reserved = await this.reservedOf(lot.id);
        const minUnits = Math.max(1, lot.participantes_minimos || 1);
        if (reserved >= minUnits) {
          await this.closeLot(lot.id);
        } else {
          await this.cancelLot(lot.id);
        }
        processed++;
      } catch (e: any) {
        console.error(`[Lot] Error cerrando lote ${lot.id.slice(0, 8)}:`, e.message);
      }
    }
    if (processed > 0) {
      console.log(`[Lot] ${processed} lote(s) cerrado(s)/cancelado(s) por vencimiento`);
    }
    return processed;
  }

  /** Reconciliación: el total del lote nunca debe superar el stock real del producto */
  private async syncTotals() {
    try {
      await this.dataSource.query(
        `UPDATE lot_sales l
         SET cantidad_total = p.stock
         FROM products p
         WHERE p.id = l.product_id
           AND p.deleted_at IS NULL
           AND p.metodo_pago = 'venta_por_lote'
           AND p.stock > 0
           AND l.estado IN ('abierto', 'pendiente')
           AND l.cantidad_total != p.stock`
      );
    } catch (e: any) {
      console.error("[Lot] Error sincronizando totales:", e.message);
    }
  }

  async getParticipantCount(lotSaleId: string): Promise<number> {
    return this.participantsRepo.count({ where: { lot_sale_id: lotSaleId } });
  }

  private serialize(row: any): any {
    const reserved = Math.max(
      Number(row.cantidad_reservada_calc ?? 0),
      Number(row.cantidad_reservada ?? 0),
    );
    const productStock = Number(row.product_stock || 0);
    let total = Number(row.cantidad_total || 1);
    if (productStock > 0) total = Math.min(total, productStock);

    let tiers: any[] = [];
    try {
      tiers = Array.isArray(row.rcg_tiers)
        ? row.rcg_tiers.map((t: any) => ({ ...t, valor: Number(t.valor || 0) }))
        : [];
    } catch {
      tiers = [];
    }

    const metaVenta = Number(row.meta_venta) || total;
    const cierreTier = this.pickCierreTier(tiers, reserved);
    const expectativaTier = this.pickExpectativaTier(
      tiers,
      { meta_venta: row.meta_venta, cantidad_total: total } as any,
      reserved,
    );

    return {
      id: row.id,
      product_id: row.product_id,
      vendedor_id: row.vendedor_id,
      precio_lote: Number(row.precio_lote || 0),
      precio_individual: Number(row.precio_individual || 0),
      participantes_minimos: Number(row.participantes_minimos || 1),
      cmc: Number(row.cmc || 1),
      cantidad_total: total,
      cantidad_reservada: reserved,
      cantidad_disponible: Math.max(0, total - reserved),
      meta_venta: metaVenta,
      destacado: row.destacado === true || row.destacado === "t",
      divisible: row.divisible !== false && row.divisible !== "f",
      rcg_tiers: tiers,
      tier_actual: cierreTier,
      expectativa_superada: reserved >= metaVenta,
      fecha_cierre: row.fecha_cierre,
      estado: row.estado,
      created_at: row.created_at,
      participantes_count: Number(row.participantes_count || 0),
      product_title: row.product_title,
      product_specifications: row.product_specifications,
      product_sku: row.product_sku,
      vendedor_first_name: row.vendedor_first_name || "",
      vendedor_last_name: row.vendedor_last_name || "",
      vendedor_email: row.vendedor_email || "",
    };
  }
}
