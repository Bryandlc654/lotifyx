import { Injectable, OnModuleInit, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AuditService } from "../audit/audit.service";
import { MailService } from "../mail/mail.service";
import { ConfigService } from "../config/config.service";
import { CollusionService } from "../collusion/collusion.service";

@Injectable()
export class CheckoutService implements OnModuleInit {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly collusion: CollusionService,
  ) {}

  async onModuleInit() {
    try {
      const missing = await this.dataSource.query(
        `SELECT o.id, o.total_amount, a.product_id
         FROM orders o
         INNER JOIN auction_bids ab ON ab.checkout_id = o.id
         INNER JOIN auctions a ON a.id = ab.auction_id
         WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id)`
      );
      for (const row of missing) {
        await this.dataSource.query(
          `INSERT INTO order_items (order_id, product_id, price, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING`,
          [row.id, row.product_id, row.total_amount]
        );
      }
      if (missing.length > 0) {
        console.log(`[CheckoutService] Fixed ${missing.length} legacy auction orders missing order_items`);
      }
    } catch (e: any) {
      console.error("[CheckoutService] Error fixing legacy auction orders:", e.message);
    }
  }

  async createOrder(data: {
    userId: string;
    total: number;
    items: { id: string; price: number; qty?: number; variant_id?: string }[];
    originAccountId: string;
    operationNumber: string;
    amount: number;
    proofUrl: string;
    servicioDescripcion?: string | null;
    entregaModalidad?: string | null;
  }) {
    if (data.items.length > 0) {
      const productIds = data.items.map(i => i.id);
      const ownProducts = await this.dataSource.query(
        `SELECT id FROM products WHERE id = ANY($1) AND user_id = $2 AND deleted_at IS NULL`,
        [productIds, data.userId],
      );
      if (ownProducts.length > 0) {
        throw new BadRequestException("No puedes comprar tus propios productos");
      }
      // Validación de stock antes de crear la orden: cantidad solicitada vs disponible
      const stockRows = await this.dataSource.query(
        `SELECT id, title, stock, status FROM products WHERE id = ANY($1) AND deleted_at IS NULL`,
        [productIds],
      );
      const stockById: Record<string, any> = {};
      for (const r of stockRows) stockById[r.id] = r;
      for (const item of data.items) {
        const p = stockById[item.id];
        if (!p || p.status !== "active") {
          throw new BadRequestException("Un producto de tu carrito ya no está disponible");
        }
        const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
        if (p.stock != null && qty > Number(p.stock)) {
          throw new BadRequestException(
            `Stock insuficiente para "${p.title}": solicitaste ${qty} y quedan ${p.stock} unidad(es)`
          );
        }
      }
      const cmcRows = await this.dataSource.query(
        `SELECT id, min_qty FROM products WHERE id = ANY($1) AND deleted_at IS NULL`,
        [productIds],
      );
      const cmcById: Record<string, number> = {};
      for (const r of cmcRows) cmcById[r.id] = Math.max(1, Number(r.min_qty) || 1);
      for (const item of data.items) {
        const min = cmcById[item.id] || 1;
        const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
        if (qty < min) {
          throw new BadRequestException(
            `Cantidad mínima de compra (CMC): debes comprar al menos ${min} unidad(es) del producto`
          );
        }
      }
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const totalAmount = data.total > 0 ? data.total : data.amount;
      // Número de pedido único y legible para el comprador
      let orderNumber = `LOT-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random().toString(36).toUpperCase().slice(2, 4)}`;
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = `LOT-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random().toString(36).toUpperCase().slice(2, 4)}`;
        const [dup] = await queryRunner.query(`SELECT 1 FROM orders WHERE order_number = $1`, [candidate]);
        if (!dup) { orderNumber = candidate; break; }
      }
      const [order] = await queryRunner.query(
        `INSERT INTO orders (user_id, total_amount, status, origin_account_id, operation_number, amount, proof_image, servicio_descripcion, entrega_modalidad, order_number, created_at, updated_at)
         VALUES ($1, $2, 'pending_payment', $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING *`,
        [data.userId, totalAmount, data.originAccountId, data.operationNumber, data.amount, data.proofUrl, data.servicioDescripcion || null, data.entregaModalidad || null, orderNumber || null],
      );

      if (data.items.length > 0) {
        const values = data.items.map((_, i) => `($1, $${2 + i * 4}, $${3 + i * 4}, $${4 + i * 4}, $${5 + i * 4}, NOW())`).join(", ");
        const params = [order.id];
        for (const item of data.items) { params.push(item.id, item.price, Math.max(1, Math.floor(Number(item.qty) || 1)), item.variant_id || null); }
        await queryRunner.query(
          `INSERT INTO order_items (order_id, product_id, price, qty, variant_id, created_at) VALUES ${values}`,
          params,
        );

        // El stock se descuenta al CREAR el pedido (reserva inmediata), no al confirmar el pago.
        // Si el pago no se confirma en plazo, el cron de cancelación reintegra el stock automáticamente.
        await queryRunner.query(
          `UPDATE products p
           SET stock = GREATEST(p.stock - oi.qty, 0)
           FROM order_items oi
           WHERE oi.order_id = $1 AND oi.product_id = p.id AND p.stock > 0`,
          [order.id],
        );
        await queryRunner.query(
          `UPDATE product_variants pv
           SET stock = GREATEST(pv.stock - oi.qty, 0)
           FROM order_items oi
           WHERE oi.order_id = $1 AND oi.variant_id IS NOT NULL AND oi.variant_id = pv.id AND pv.stock > 0`,
          [order.id],
        );
        await queryRunner.query(
          `UPDATE products SET status = 'agotado'
           WHERE id IN (
             SELECT oi.product_id FROM order_items oi WHERE oi.order_id = $1
           ) AND stock <= 0 AND deleted_at IS NULL`,
          [order.id],
        );
        await queryRunner.query(`UPDATE orders SET stock_deducted = true WHERE id = $1`, [order.id]);
      }

      await queryRunner.commitTransaction();
      this.audit.log({ userId: data.userId, action: "order_created", entity: "order", entityId: order.id, details: { items: data.items.length, total: data.total } });
      return order;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async approveOrder(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1`,
        [id],
      );

      // Si la orden proviene de una venta por lote, marca la garantía del participante como pagada
      await queryRunner.query(
        `UPDATE lot_participants SET garantia_pagada = true WHERE order_id = $1`,
        [id],
      );

      const [bidLink] = await queryRunner.query(
        `SELECT id FROM auction_bids WHERE checkout_id = $1 LIMIT 1`,
        [id],
      );
      const [isRemainingOrder] = await queryRunner.query(
        `SELECT 1 FROM auctions WHERE remaining_order_id = $1 LIMIT 1`,
        [id],
      );
      const [isSaldoStage] = await queryRunner.query(
        `SELECT 1 FROM orders WHERE id = $1 AND payment_stage = 'saldo' LIMIT 1`,
        [id],
      );
      const [stockFlag] = await queryRunner.query(
        `SELECT stock_deducted FROM orders WHERE id = $1`,
        [id],
      );
      const stockDeducted = !!stockFlag?.stock_deducted;

      // Las órdenes de puja y las de saldo de subasta conservan su comportamiento previo.
      // Las órdenes creadas por checkout YA descontaron stock al crearse (stock_deducted).
      // Solo las órdenes legacy/de ofertas descuentan aquí; las de saldo de lote no descuentan.
      if (!bidLink || isRemainingOrder) {
        if (!isRemainingOrder) {
          if (!isSaldoStage && !stockDeducted) {
            await queryRunner.query(
              `UPDATE products p
               SET stock = GREATEST(p.stock - oi.qty, 0)
               FROM order_items oi
               WHERE oi.order_id = $1 AND oi.product_id = p.id AND p.stock > 0`,
              [id],
            );
            // Descuento de stock por variante (control independiente por variante)
            await queryRunner.query(
              `UPDATE product_variants pv
               SET stock = GREATEST(pv.stock - oi.qty, 0)
               FROM order_items oi
               WHERE oi.order_id = $1 AND oi.variant_id IS NOT NULL AND oi.variant_id = pv.id AND pv.stock > 0`,
              [id],
            );
            // Agotado automático: si el stock del producto llegó a 0, marcar como 'agotado'
            await queryRunner.query(
              `UPDATE products SET status = 'agotado'
               WHERE id IN (
                 SELECT oi.product_id FROM order_items oi WHERE oi.order_id = $1
               ) AND stock <= 0 AND deleted_at IS NULL`,
              [id],
            );
            await queryRunner.query(`UPDATE orders SET stock_deducted = true WHERE id = $1`, [id]);
          }

          await queryRunner.query(
            `INSERT INTO funds (user_id, available_balance, pending_balance, disputed_balance)
             SELECT p.user_id, 0, 0, 0 FROM order_items oi
             INNER JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = $1
             ON CONFLICT (user_id) DO NOTHING`,
            [id],
          );

          // Multi-vendedor: acredita a cada vendedor el subtotal de SUS artículos (pago único, liquidación separada)
          await queryRunner.query(
            `UPDATE funds f
             SET pending_balance = f.pending_balance + s.subtotal
             FROM (
               SELECT p.user_id, SUM(oi.price * oi.qty) AS subtotal
               FROM order_items oi
               INNER JOIN products p ON p.id = oi.product_id
               WHERE oi.order_id = $1
               GROUP BY p.user_id
             ) s
             WHERE f.user_id = s.user_id`,
            [id],
          );
        }
      }

      await queryRunner.commitTransaction();
      this.audit.log({ action: "order_approved", entity: "order", entityId: id });

      this.dataSource.query(
        `UPDATE auction_bids SET estado = 'confirmada' WHERE checkout_id = $1 AND estado = 'pendiente'`,
        [id],
      ).catch(e => console.error("[CheckoutService] Error confirming bid:", e.message));

      return { message: "Pago aprobado y stock actualizado" };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async rejectOrder(id: string, motivo: string) {
    await this.dataSource.query(
      `UPDATE orders SET status = 'rejected', rejected_reason = $2, updated_at = NOW() WHERE id = $1`,
      [id, motivo],
    );
    // Si el stock fue descontado al crear el pedido, se reintegra
    const [flag] = await this.dataSource.query(`SELECT stock_deducted FROM orders WHERE id = $1`, [id]);
    if (flag?.stock_deducted) await this.restoreStockForOrder(this.dataSource, id);
    this.audit.log({ action: "order_rejected", entity: "order", entityId: id, details: { motivo } });
    return { message: "Pago rechazado" };
  }

  /** Reintegra el stock descontado por una orden cancelada/rechazada (productos y variantes). */
  private async restoreStockForOrder(runner: any, orderId: string) {
    await runner.query(
      `UPDATE products p SET stock = p.stock + oi.qty
       FROM order_items oi
       WHERE oi.order_id = $1 AND oi.product_id = p.id`,
      [orderId],
    );
    await runner.query(
      `UPDATE product_variants pv SET stock = pv.stock + oi.qty
       FROM order_items oi
       WHERE oi.order_id = $1 AND oi.variant_id IS NOT NULL AND oi.variant_id = pv.id`,
      [orderId],
    );
    await runner.query(
      `UPDATE products SET status = 'active'
       WHERE id IN (SELECT product_id FROM order_items WHERE order_id = $1)
         AND status = 'agotado' AND stock > 0 AND deleted_at IS NULL`,
      [orderId],
    );
    await runner.query(`UPDATE orders SET stock_deducted = false WHERE id = $1`, [orderId]);
  }

  /**
   * Cancelación manual bajo reglas:
   * - Comprador: puede cancelar si la orden está Pendiente o Pagado y aún no está En preparación.
   * - A partir de En preparación (tracking iniciado) requiere intervención del Administrador.
   * - El stock descontado se reintegra automáticamente.
   */
  async cancelOrder(userId: string, orderId: string, motivo: string, isAdmin: boolean) {
    const [order] = await this.dataSource.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    if (!order) throw new NotFoundException("Pedido no encontrado");
    if (!isAdmin && order.user_id !== userId) throw new ForbiddenException("No puedes cancelar este pedido");
    if (["completed", "cancelled", "rejected"].includes(order.status)) {
      throw new BadRequestException("Este pedido ya no puede cancelarse");
    }
    if (!isAdmin) {
      if (!["pending_payment", "paid"].includes(order.status)) {
        throw new ForbiddenException("Solo un administrador puede cancelar el pedido en esta etapa");
      }
      if (order.tracking_status) {
        throw new ForbiddenException("El pedido está En preparación; la cancelación requiere intervención del Administrador");
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(
        `UPDATE orders SET status = 'cancelled', cancelled_reason = $2, updated_at = NOW() WHERE id = $1`,
        [orderId, motivo],
      );
      if (order.stock_deducted) await this.restoreStockForOrder(queryRunner, orderId);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    this.audit.log({
      userId,
      action: isAdmin ? "order_cancelled_admin" : "order_cancelled_buyer",
      entity: "order",
      entityId: orderId,
      details: { motivo },
    });
    return { message: "Pedido cancelado. El stock fue reintegrado." };
  }

  async updateOrderStatus(id: string, status: string) {
    const valid = ["pending_payment", "completed", "rejected", "paid"];
    if (!valid.includes(status)) throw new BadRequestException("El estado seleccionado no es válido");
    await this.dataSource.query(
      `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1`,
      [id, status],
    );
    this.audit.log({ action: "order_status_updated", entity: "order", entityId: id, details: { status } });
    return { message: "Estado actualizado" };
  }

  async updateOrderTracking(
    orderId: string,
    userId: string,
    data: { status: string; note?: string; shipping_address?: string; shipping_reference?: string; shipping_city?: string; shipping_notes?: string; tracking_number?: string; estimated_at?: string },
  ) {
    const [order] = await this.dataSource.query(
      `SELECT o.*, p.user_id AS seller_id FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.id = $1::uuid LIMIT 1`,
      [orderId],
    );
    if (!order) throw new NotFoundException("Pedido no encontrado");
    // Multi-vendedor: cualquier vendedor con artículos en la orden puede actualizar el tracking
    const [sellerInOrder] = await this.dataSource.query(
      `SELECT 1 FROM order_items oi
       INNER JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1::uuid AND p.user_id = $2::uuid LIMIT 1`,
      [orderId, userId],
    );
    if (!sellerInOrder) throw new ForbiddenException("Solo el vendedor puede actualizar el tracking");

    const validStatuses = ["coordination", "shipping", "delivered"];
    if (!validStatuses.includes(data.status)) throw new BadRequestException("El estado seleccionado no es válido");

    const dateColumn = data.status === "coordination" ? "tracking_coordination_at"
      : data.status === "shipping" ? "tracking_shipping_at"
      : "tracking_delivered_at";

    const extraUpdates = data.estimated_at ? `, tracking_estimated_at = $3::timestamp` : "";
    await this.dataSource.query(
      `UPDATE orders SET tracking_status = $1, ${dateColumn} = NOW(), updated_at = NOW()${extraUpdates}
       WHERE id = $2::uuid`,
      data.estimated_at ? [data.status, orderId, data.estimated_at] : [data.status, orderId],
    );

    if (data.shipping_address || data.shipping_reference || data.shipping_city || data.shipping_notes || data.tracking_number) {
      const updates: string[] = [];
      const params: any[] = [orderId];
      if (data.shipping_address !== undefined) { updates.push(`shipping_address = $${params.length + 1}`); params.push(data.shipping_address); }
      if (data.shipping_reference !== undefined) { updates.push(`shipping_reference = $${params.length + 1}`); params.push(data.shipping_reference); }
      if (data.shipping_city !== undefined) { updates.push(`shipping_city = $${params.length + 1}`); params.push(data.shipping_city); }
      if (data.shipping_notes !== undefined) { updates.push(`shipping_notes = $${params.length + 1}`); params.push(data.shipping_notes); }
      if (data.tracking_number !== undefined) { updates.push(`tracking_number = $${params.length + 1}`); params.push(data.tracking_number); }
      if (updates.length) {
        await this.dataSource.query(
          `UPDATE orders SET ${updates.join(", ")} WHERE id = $1::uuid`,
          params,
        );
      }
    }

    await this.dataSource.query(
      `INSERT INTO order_tracking_history (order_id, status, note, created_by) VALUES ($1::uuid, $2, $3, $4::uuid)`,
      [orderId, data.status, data.note || null, userId],
    );

    if (data.status === "delivered") {
      await this.dataSource.query(
        `UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = $1::uuid AND status = 'paid'`,
        [orderId],
      );
      // Multi-vendedor: libera el saldo pendiente a disponible por cada vendedor según SUS artículos
      await this.dataSource.query(
        `UPDATE funds f
         SET available_balance = f.available_balance + s.subtotal,
             pending_balance = f.pending_balance - s.subtotal
         FROM (
           SELECT p.user_id, SUM(oi.price * oi.qty) AS subtotal
           FROM order_items oi
           INNER JOIN products p ON p.id = oi.product_id
           WHERE oi.order_id = $1::uuid
           GROUP BY p.user_id
         ) s
         WHERE f.user_id = s.user_id`,
        [orderId],
      );
      this.audit.log({ userId, action: "order_completed", entity: "order", entityId: orderId, details: { status: "completed" } });

      try {
        const [buyer] = await this.dataSource.query(
          `SELECT u.email, up.first_name FROM users u
           LEFT JOIN user_profiles up ON up.user_id = u.id
           WHERE u.id = (SELECT user_id FROM orders WHERE id = $1::uuid)`,
          [orderId],
        );
        if (buyer?.email) {
          await this.mail.sendOrderDelivered(
            buyer.email,
            buyer.first_name || "Comprador",
            orderId,
            order.operation_number || "",
          );
        }
      } catch (e) {
        console.error("[CheckoutService] Error sending delivered email:", e);
      }
    }

    this.audit.log({ userId, action: "order_tracking_updated", entity: "order", entityId: orderId, details: { status: data.status } });
    return { message: "Tracking actualizado" };
  }

  /** Cancela órdenes pendientes de pago vencidas (oferta/puja sin intención real de contratar).
   *  El límite de días y la sanción por incumplimiento son configurables desde el panel admin (Umbrales). */
  @Cron(CronExpression.EVERY_HOUR)
  async cancelExpiredPendingOrders() {
    try {
      const days = await this.config.getNum("limite_pago_dias");
      const result = await this.dataSource.query(
        `UPDATE orders
         SET status = 'cancelled', updated_at = NOW()
         WHERE status = 'pending_payment'
           AND created_at < NOW() - ($1::int * INTERVAL '1 day')
         RETURNING id, user_id`,
        [days],
      );
      if (result.length > 0) {
        // Reintegra el stock descontado al crear el pedido (las órdenes vencidas liberan inventario)
        for (const o of result as any[]) {
          const [flag] = await this.dataSource.query(`SELECT stock_deducted FROM orders WHERE id = $1`, [o.id]);
          if (flag?.stock_deducted) {
            try { await this.restoreStockForOrder(this.dataSource, o.id); } catch (e: any) {
              console.error("[Checkout] Error reintegrando stock de orden vencida:", e.message);
            }
          }
        }
        const userIds: string[] = [...new Set((result as any[]).map((o: any) => o.user_id))];
        for (const o of result) {
          this.audit.log({
            userId: o.user_id,
            action: "order_cancelled_expired",
            entity: "order",
            entityId: o.id,
            details: { motivo: `No pagado en ${days} días` },
          });
        }
        // Penalización por incumplimiento (configurable): incrementa contador y sanciona si supera el umbral
        for (const uid of userIds) {
          const res = await this.collusion.registerIncumplimiento(uid);
          if (res.sancionado) {
            this.audit.log({
              userId: uid,
              action: "user_sancionado",
              entity: "user",
              entityId: uid,
              details: { motivo: `${res.incumplimientos} incumplimientos de pago`, dias: res.sancion_dias },
            });
          }
        }
        console.log(`[Checkout] ${result.length} orden(es) pendiente(s) cancelada(s) por vencer el pago (${days} días)`);
      }
    } catch (e: any) {
      console.error("[Checkout] Error cancelando órdenes vencidas:", e.message);
    }
  }
}
