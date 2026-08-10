import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { DataSource } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { LotSale } from "./lot-sale.entity";
import { LotParticipant } from "./lot-participant.entity";

const LOT_SELECT = `
  l.id, l.product_id, l.vendedor_id, l.precio_lote, l.precio_individual,
  l.participantes_minimos, l.cantidad_total, l.cantidad_reservada,
  l.fecha_cierre, l.estado, l.created_at, l.updated_at,
  COALESCE((SELECT SUM(lp.cantidad) FROM lot_participants lp
            WHERE lp.lot_sale_id = l.id AND lp.estado = 'reservado'), 0) AS cantidad_reservada_calc,
  (SELECT COUNT(*) FROM lot_participants lp
   WHERE lp.lot_sale_id = l.id AND lp.estado = 'reservado') AS participantes_count,
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
  ) {}

  async onModuleInit() {
    try {
      // Crear registros de lote faltantes para productos existentes
      const missing = await this.dataSource.query(
        `SELECT p.id, p.user_id, p.precio_lote, p.precio_individual,
                COALESCE(p.participantes_minimos, 1) AS participantes_minimos,
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
          `INSERT INTO lot_sales (product_id, vendedor_id, precio_lote, precio_individual, participantes_minimos, cantidad_total, fecha_cierre, estado)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (product_id) DO NOTHING`,
          [p.id, p.user_id, p.precio_lote, p.precio_individual || 0,
           p.participantes_minimos, p.cantidad_total,
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
      `SELECT lp.id, lp.lot_sale_id, lp.comprador_id, lp.cantidad, lp.estado, lp.created_at,
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

    const data: any = {
      product_id: dto.product_id,
      vendedor_id: dto.vendedor_id,
      precio_lote: dto.precio_lote,
      precio_individual: dto.precio_individual,
      participantes_minimos,
      cantidad_total,
      estado: "pendiente",
    };
    if (dto.fecha_cierre) data.fecha_cierre = new Date(dto.fecha_cierre);
    return this.repo.save(this.repo.create(data));
  }

  async join(lotSaleId: string, compradorId: string, cantidad: number = 1) {
    const lot = await this.repo.findOne({ where: { id: lotSaleId } });
    if (!lot) throw new NotFoundException("Venta por lote no encontrada");
    if (lot.estado !== "abierto") throw new BadRequestException("Esta venta por lote ya cerró");
    if (lot.vendedor_id === compradorId) throw new BadRequestException("No puedes unirte a tu propio lote");

    const qty = Math.floor(Number(cantidad));
    if (!qty || qty < 1) throw new BadRequestException("Ingresa una cantidad válida");

    // El lote nunca puede superar el stock real del producto
    const [prodRow] = await this.dataSource.query(
      `SELECT stock FROM products WHERE id = $1`,
      [lot.product_id],
    );
    const productStock = Number(prodRow?.stock || 0);
    const lotTotal = Math.max(1, lot.cantidad_total || 1);
    const cantidadTotal = productStock > 0 ? Math.min(lotTotal, productStock) : lotTotal;
    if (qty > cantidadTotal) {
      throw new BadRequestException(`La cantidad máxima disponible es ${cantidadTotal} unidad(es)`);
    }

    const reserved = await this.reservedOf(lotSaleId);

    const existing = await this.participantsRepo.findOne({
      where: { lot_sale_id: lotSaleId, comprador_id: compradorId },
    });

    const currentQty = existing && existing.estado === "reservado" ? Number(existing.cantidad) || 0 : 0;
    const totalReserved = reserved - currentQty + qty;
    if (totalReserved > cantidadTotal) {
      const disponible = cantidadTotal - (reserved - currentQty);
      throw new BadRequestException(
        disponible <= 0
          ? "El lote ya no tiene unidades disponibles"
          : `Solo quedan ${disponible} unidad(es) disponible(s) en el lote`
      );
    }

    if (existing) {
      if (existing.estado !== "reservado") {
        throw new BadRequestException("Ya participaste en este lote");
      }
      existing.cantidad = qty;
      await this.participantsRepo.save(existing);
    } else {
      await this.participantsRepo.save(this.participantsRepo.create({
        lot_sale_id: lotSaleId,
        comprador_id: compradorId,
        cantidad: qty,
        estado: "reservado",
      }));
    }

    lot.cantidad_reservada = totalReserved;
    await this.repo.save(lot);

    const minUnits = Math.max(1, lot.participantes_minimos || 1);
    const reachMinimo = totalReserved >= minUnits;
    const reachTotal = totalReserved >= cantidadTotal;
    if (reachMinimo || reachTotal) {
      await this.closeLot(lotSaleId);
      return { message: "Lote completo. Tu reserva quedó confirmada.", lot_cerrado: true, lot_id: lotSaleId };
    }

    return {
      message: "Te uniste al lote. La reserva queda pendiente hasta completar el mínimo.",
      lot_cerrado: false,
      lot_id: lotSaleId,
    };
  }

  async getParticipants(lotSaleId: string) {
    await this.closeExpired();
    return this.dataSource.query(
      `SELECT lp.id, lp.lot_sale_id, lp.comprador_id, lp.cantidad, lp.estado, lp.created_at,
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

  async closeLot(lotSaleId: string) {
    const lot = await this.repo.findOne({ where: { id: lotSaleId } });
    if (!lot) throw new NotFoundException("Venta por lote no encontrada");
    lot.estado = "cerrado";
    await this.repo.save(lot);
    await this.dataSource.query(
      `UPDATE lot_participants SET estado = 'confirmado' WHERE lot_sale_id = $1 AND estado = 'reservado'`,
      [lotSaleId],
    );
    return lot;
  }

  async cancelLot(lotSaleId: string) {
    const lot = await this.repo.findOne({ where: { id: lotSaleId } });
    if (!lot) throw new NotFoundException("Venta por lote no encontrada");
    lot.estado = "cancelado";
    await this.repo.save(lot);
    await this.dataSource.query(
      `UPDATE lot_participants SET estado = 'cancelado' WHERE lot_sale_id = $1 AND estado = 'reservado'`,
      [lotSaleId],
    );
    return lot;
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
    const reserved = Number(row.cantidad_reservada_calc ?? row.cantidad_reservada ?? 0);
    const productStock = Number(row.product_stock || 0);
    let total = Number(row.cantidad_total || 1);
    if (productStock > 0) total = Math.min(total, productStock);
    return {
      id: row.id,
      product_id: row.product_id,
      vendedor_id: row.vendedor_id,
      precio_lote: Number(row.precio_lote || 0),
      precio_individual: Number(row.precio_individual || 0),
      participantes_minimos: Number(row.participantes_minimos || 1),
      cantidad_total: total,
      cantidad_reservada: reserved,
      cantidad_disponible: Math.max(0, total - reserved),
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
