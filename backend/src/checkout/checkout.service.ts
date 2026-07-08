import { Injectable, OnModuleInit, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AuditService } from "../audit/audit.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class CheckoutService implements OnModuleInit {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  async onModuleInit() {
    // Fix legacy auction orders missing order_items records
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

  async getOrders(userId: string) {
    const orders = await this.dataSource.query(
      `SELECT o.*, oi.id as item_id, oi.product_id, oi.price as item_price,
              p.title as product_title, p.user_id as seller_id,
              up.first_name as seller_first_name, up.last_name as seller_last_name,
              u.email as seller_email, u.phone as seller_phone
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       LEFT JOIN users u ON u.id = p.user_id
       LEFT JOIN user_profiles up ON up.user_id = p.user_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT 200`,
      [userId],
    );

    const grouped: Record<string, any> = {};
    const orderIds = [...new Set(orders.map((r: any) => r.id))];
    const bidsForOrders = orderIds.length ? await this.dataSource.query(
      `SELECT ab.checkout_id, ab.monto AS bid_amount FROM auction_bids ab WHERE ab.checkout_id = ANY($1)`,
      [orderIds],
    ) : [];
    const bidMap: Record<string, any> = {};
    for (const b of bidsForOrders) bidMap[b.checkout_id] = { bid_amount: b.bid_amount };

    for (const row of orders) {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id,
          user_id: row.user_id,
          total_amount: row.total_amount,
          status: row.status,
          origin_account_id: row.origin_account_id,
          operation_number: row.operation_number,
          amount: row.amount,
          proof_image: row.proof_image,
          rejected_reason: row.rejected_reason,
          created_at: row.created_at,
          items: [],
          bid_info: bidMap[row.id] || null,
        };
      }
      if (row.product_id) {
        grouped[row.id].items.push({
          id: row.item_id,
          product_id: row.product_id,
          product_title: row.product_title,
          price: row.item_price,
          seller: row.seller_id
            ? {
                id: row.seller_id,
                first_name: row.seller_first_name,
                last_name: row.seller_last_name,
                email: row.seller_email,
                phone: row.seller_phone,
              }
            : null,
        });
      }
    }
    return Object.values(grouped);
  }

  async findAllOrders(status?: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const countParams: any[] = [];
    const statusFilter = status ? `WHERE o.status = $1` : "";
    if (status) countParams.push(status);

    const [{ count }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as count FROM (SELECT o.id FROM orders o ${statusFilter} GROUP BY o.id) sub`,
      countParams,
    );
    const total = Number(count);

    const orderParams: any[] = [];
    if (status) orderParams.push(status);
    orderParams.push(limit, offset);

    const orders = await this.dataSource.query(
      `SELECT o.*, oi.id as item_id, oi.product_id, oi.price as item_price,
              p.title as product_title, p.user_id as seller_id, p.sku as product_sku,
              up.first_name as seller_first_name, up.last_name as seller_last_name,
              u.email as seller_email, u.phone as seller_phone,
              buyer.email as buyer_email,
              bup.first_name as buyer_first_name, bup.last_name as buyer_last_name
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       LEFT JOIN users u ON u.id = p.user_id
       LEFT JOIN user_profiles up ON up.user_id = p.user_id
       LEFT JOIN users buyer ON buyer.id = o.user_id
       LEFT JOIN user_profiles bup ON bup.user_id = o.user_id
       ${statusFilter}
       ORDER BY o.created_at DESC
       LIMIT $${orderParams.length - 1} OFFSET $${orderParams.length}`,
      orderParams,
    );

    const orderIds = [...new Set(orders.map((r: any) => r.id))];
    const bidsForOrders = orderIds.length ? await this.dataSource.query(
      `SELECT checkout_id, monto AS bid_amount FROM auction_bids WHERE checkout_id = ANY($1)`,
      [orderIds],
    ) : [];
    const bidMap: Record<string, any> = {};
    for (const b of bidsForOrders) bidMap[b.checkout_id] = { bid_amount: b.bid_amount };

    const grouped: Record<string, any> = {};
    for (const row of orders) {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id,
          user_id: row.user_id,
          total_amount: row.total_amount,
          status: row.status,
          origin_account_id: row.origin_account_id,
          operation_number: row.operation_number,
          amount: row.amount,
          proof_image: row.proof_image,
          rejected_reason: row.rejected_reason,
          created_at: row.created_at,
          buyer: row.buyer_first_name
            ? { first_name: row.buyer_first_name, last_name: row.buyer_last_name, email: row.buyer_email }
            : null,
          items: [],
          bid_info: bidMap[row.id] || null,
        };
      }
      if (row.product_id) {
        grouped[row.id].items.push({
          id: row.item_id,
          product_id: row.product_id,
          product_title: row.product_title,
          product_sku: row.product_sku,
          price: row.item_price,
          seller: row.seller_id
            ? {
                id: row.seller_id,
                first_name: row.seller_first_name,
                last_name: row.seller_last_name,
                email: row.seller_email,
                phone: row.seller_phone,
              }
            : null,
        });
      }
    }
    return {
      data: Object.values(grouped),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDashboard(userId: string) {
    const [[productsStats], [salesStats], recentOrders, recentProducts] = await Promise.all([
      this.dataSource.query(
        `SELECT
           COUNT(*)::int as total,
           COUNT(*) FILTER (WHERE status = 'active')::int as active,
           COUNT(*) FILTER (WHERE status = 'pending_approval')::int as pending,
           COUNT(*) FILTER (WHERE status = 'draft')::int as draft
         FROM products WHERE user_id = $1`,
        [userId],
      ),
      this.dataSource.query(
        `SELECT
           COUNT(DISTINCT o.id)::int as total_sales,
           COALESCE(SUM(oi.price) FILTER (WHERE o.status = 'completed'), 0)::numeric as revenue,
           COUNT(*) FILTER (WHERE o.status = 'completed')::int as completed,
           COUNT(*) FILTER (WHERE o.status = 'pending_payment')::int as pending_payment
         FROM orders o
         INNER JOIN order_items oi ON oi.order_id = o.id
         INNER JOIN products p ON p.id = oi.product_id AND p.user_id = $1`,
        [userId],
      ),
      this.dataSource.query(
        `SELECT o.id, o.total_amount, o.status, o.created_at,
                oi.price as item_price, p.title as product_title
         FROM orders o
         INNER JOIN order_items oi ON oi.order_id = o.id
         INNER JOIN products p ON p.id = oi.product_id AND p.user_id = $1
         ORDER BY o.created_at DESC LIMIT 5`,
        [userId],
      ),
      this.dataSource.query(
        `SELECT id, title, sku, status, created_at FROM products
         WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [userId],
      ),
    ]);

    return {
      products: productsStats,
      sales: salesStats,
      recentOrders,
      recentProducts,
    };
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

      await queryRunner.query(
        `UPDATE products SET stock = GREATEST(stock - 1, 0)
         WHERE id IN (SELECT product_id FROM order_items WHERE order_id = $1) AND stock > 0`,
        [id],
      );

      await queryRunner.query(
        `UPDATE funds SET pending_balance = pending_balance + (
           SELECT SUM(oi.price) FROM order_items oi WHERE oi.order_id = $1
         )
         WHERE user_id = (
           SELECT p.user_id FROM order_items oi
           INNER JOIN products p ON p.id = oi.product_id
           WHERE oi.order_id = $1 LIMIT 1
         )`,
        [id],
      );

      await queryRunner.query(
        `INSERT INTO funds (user_id, available_balance, pending_balance, disputed_balance)
         SELECT p.user_id, 0, 0, 0 FROM order_items oi
         INNER JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1
         ON CONFLICT (user_id) DO NOTHING`,
        [id],
      );

      await queryRunner.commitTransaction();
      this.audit.log({ action: "order_approved", entity: "order", entityId: id });

      // Confirm pending auction bid linked to this order (non-blocking)
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

  async updateOrderStatus(id: string, status: string) {
    const valid = ["pending_payment", "completed", "rejected", "paid"];
    if (!valid.includes(status)) throw new BadRequestException("Estado inválido");
    await this.dataSource.query(
      `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1`,
      [id, status],
    );
    this.audit.log({ action: "order_status_updated", entity: "order", entityId: id, details: { status } });
    return { message: "Estado actualizado" };
  }

  async createClaim(data: { userId: string; orderId: string; reason: string; description: string; solution: string; amount: number | null }) {
    await this.dataSource.query(
      `INSERT INTO claims (order_id, user_id, reason, description, solution, amount) VALUES ($1,$2,$3,$4,$5,$6)`,
      [data.orderId, data.userId, data.reason, data.description, data.solution, data.amount],
    );
    this.audit.log({ userId: data.userId, action: "claim_created", entity: "claim", entityId: data.orderId, details: { reason: data.reason } });
    return { message: "Reclamo enviado correctamente" };
  }

  async findAllClaims() {
    return this.dataSource.query(
      `SELECT c.*, o.total_amount, o.created_at as order_date,
              u.email as user_email, up.first_name as user_first_name, up.last_name as user_last_name
       FROM claims c
       LEFT JOIN orders o ON o.id = c.order_id
       LEFT JOIN users u ON u.id = c.user_id
       LEFT JOIN user_profiles up ON up.user_id = c.user_id
       ORDER BY c.created_at DESC LIMIT 200`,
    );
  }

  async updateClaimStatus(id: string, status: string, response?: string) {
    await this.dataSource.query(
      `UPDATE claims SET status = $2, updated_at = NOW() WHERE id = $1`,
      [id, status],
    );
    this.audit.log({ action: "claim_updated", entity: "claim", entityId: id, details: { status } });
    return { message: "Reclamo actualizado" };
  }

  async getOrderDetail(orderId: string, userId: string) {
    const [order] = await this.dataSource.query(
      `SELECT o.*,
              buyer.email AS buyer_email,
              buyer.phone AS buyer_phone,
              buyer_profile.first_name AS buyer_first_name,
              buyer_profile.last_name AS buyer_last_name,
              buyer_profile.address AS buyer_address
       FROM orders o
       LEFT JOIN users buyer ON buyer.id = o.user_id
       LEFT JOIN user_profiles buyer_profile ON buyer_profile.user_id = o.user_id
       WHERE o.id = $1::uuid`,
      [orderId],
    );

    if (!order) throw new NotFoundException("Pedido no encontrado");

    const items = await this.dataSource.query(
      `SELECT oi.*, p.title AS product_title, p.sku AS product_sku,
              p.specifications AS product_specs, p.user_id AS seller_id
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1::uuid`,
      [orderId],
    );

    const sellerId = items[0]?.seller_id;
    const isBuyer = order.user_id === userId;
    const isSeller = sellerId === userId;
    if (!isBuyer && !isSeller) throw new ForbiddenException("No tienes acceso a este pedido");

    let sellerInfo = { seller_email: null, seller_first_name: null, seller_last_name: null, seller_phone: null };
    if (sellerId) {
      const [s] = await this.dataSource.query(
        `SELECT u.email AS seller_email, u.phone AS seller_phone,
                up.first_name AS seller_first_name, up.last_name AS seller_last_name
         FROM users u
         LEFT JOIN user_profiles up ON up.user_id = u.id
         WHERE u.id = $1::uuid`,
        [sellerId],
      );
      if (s) sellerInfo = s;
    }

    const tracking = await this.dataSource.query(
      `SELECT * FROM order_tracking_history WHERE order_id = $1::uuid ORDER BY created_at ASC`,
      [orderId],
    );

    // Get auction bid info if this order is for a guarantee payment
    const [bidInfo] = await this.dataSource.query(
      `SELECT ab.monto AS bid_amount, a.precio_inicial, a.incremento_minimo, a.fecha_fin
       FROM auction_bids ab
       INNER JOIN auctions a ON a.id = ab.auction_id
       WHERE ab.checkout_id = $1 AND ab.estado = 'confirmada'
       LIMIT 1`,
      [orderId],
    );

    return { ...order, ...sellerInfo, seller_id: sellerId, items, tracking_history: tracking, bid_info: bidInfo || null };
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
    if (order.seller_id !== userId) throw new ForbiddenException("Solo el vendedor puede actualizar el tracking");

    const validStatuses = ["coordination", "shipping", "delivered"];
    if (!validStatuses.includes(data.status)) throw new BadRequestException("Estado inválido");

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

    // When seller marks as delivered, complete the order and release funds to available_balance
    if (data.status === "delivered") {
      await this.dataSource.query(
        `UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = $1::uuid AND status = 'paid'`,
        [orderId],
      );
      await this.dataSource.query(
        `UPDATE funds SET available_balance = available_balance + (
           SELECT SUM(oi.price) FROM order_items oi WHERE oi.order_id = $1::uuid
         ), pending_balance = pending_balance - (
           SELECT SUM(oi.price) FROM order_items oi WHERE oi.order_id = $1::uuid
         )
         WHERE user_id = (
           SELECT p.user_id FROM order_items oi
           INNER JOIN products p ON p.id = oi.product_id
           WHERE oi.order_id = $1::uuid LIMIT 1
         )`,
        [orderId],
      );
      this.audit.log({ userId, action: "order_completed", entity: "order", entityId: orderId, details: { status: "completed" } });

      // Send email to buyer asking for review
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

  async rejectOrder(id: string, motivo: string) {
    await this.dataSource.query(
      `UPDATE orders SET status = 'rejected', rejected_reason = $2, updated_at = NOW() WHERE id = $1`,
      [id, motivo],
    );
    this.audit.log({ action: "order_rejected", entity: "order", entityId: id, details: { motivo } });
    return { message: "Pago rechazado" };
  }

  async getSales(userId: string) {
    const orders = await this.dataSource.query(
      `SELECT o.*, oi.id as item_id, oi.product_id, oi.price as item_price,
              p.title as product_title, p.sku as product_sku,
              buyer.email as buyer_email,
              bup.first_name as buyer_first_name, bup.last_name as buyer_last_name
       FROM orders o
       INNER JOIN order_items oi ON oi.order_id = o.id
       INNER JOIN products p ON p.id = oi.product_id AND p.user_id = $1
       LEFT JOIN users buyer ON buyer.id = o.user_id
        LEFT JOIN user_profiles bup ON bup.user_id = o.user_id
        ORDER BY o.created_at DESC
        LIMIT 200`,
      [userId],
    );

    const grouped: Record<string, any> = {};
    for (const row of orders) {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id,
          user_id: row.user_id,
          total_amount: row.total_amount,
          status: row.status,
          rejected_reason: row.rejected_reason,
          created_at: row.created_at,
          buyer: row.buyer_first_name
            ? { first_name: row.buyer_first_name, last_name: row.buyer_last_name, email: row.buyer_email }
            : null,
          items: [],
        };
      }
      if (row.product_id) {
        grouped[row.id].items.push({
          id: row.item_id,
          product_id: row.product_id,
          product_title: row.product_title,
          product_sku: row.product_sku,
          price: row.item_price,
        });
      }
    }
    return Object.values(grouped);
  }

  async createOrder(data: {
    userId: string;
    total: number;
    items: { id: string; price: number }[];
    originAccountId: string;
    operationNumber: string;
    amount: number;
    proofUrl: string;
  }) {
    if (data.items.length > 0) {
      const productIds = data.items.map(i => i.id);
      const ownProducts = await this.dataSource.query(
        `SELECT id FROM products WHERE id = ANY($1) AND user_id = $2`,
        [productIds, data.userId],
      );
      if (ownProducts.length > 0) {
        throw new BadRequestException("No puedes comprar tus propios productos");
      }
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const totalAmount = data.total > 0 ? data.total : data.amount;
      const [order] = await queryRunner.query(
        `INSERT INTO orders (user_id, total_amount, status, origin_account_id, operation_number, amount, proof_image, created_at, updated_at)
         VALUES ($1, $2, 'pending_payment', $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [data.userId, totalAmount, data.originAccountId, data.operationNumber, data.amount, data.proofUrl],
      );

      if (data.items.length > 0) {
        const values = data.items.map((_, i) => `($1, $${2 + i * 2}, $${3 + i * 2}, NOW())`).join(", ");
        const params = [order.id];
        for (const item of data.items) { params.push(item.id, item.price); }
        await queryRunner.query(
          `INSERT INTO order_items (order_id, product_id, price, created_at) VALUES ${values}`,
          params,
        );
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

  async getFunds(userId: string) {
    const [funds] = await this.dataSource.query(
      `SELECT COALESCE(available_balance, 0) AS available_balance,
              COALESCE(pending_balance, 0) AS pending_balance,
              COALESCE(disputed_balance, 0) AS disputed_balance
       FROM funds WHERE user_id = $1::uuid`,
      [userId],
    );

    if (!funds) {
      await this.dataSource.query(
        `INSERT INTO funds (user_id, available_balance, pending_balance, disputed_balance) VALUES ($1::uuid, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING`,
        [userId],
      );
      return { available_balance: 0, pending_balance: 0, disputed_balance: 0 };
    }

    return {
      available_balance: Number(funds.available_balance),
      pending_balance: Number(funds.pending_balance),
      disputed_balance: Number(funds.disputed_balance),
    };
  }

  async getWithdrawals(userId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const [{ count }] = await this.dataSource.query(
      `SELECT COUNT(*)::int FROM withdrawals WHERE user_id = $1::uuid`,
      [userId],
    );
    const rows = await this.dataSource.query(
      `SELECT * FROM withdrawals WHERE user_id = $1::uuid ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return { data: rows, total: Number(count), page, totalPages: Math.ceil(Number(count) / limit) };
  }

  async requestWithdrawal(userId: string, data: { amount: number; bank_name: string; account_number: string; account_holder: string }) {
    if (data.amount <= 0) throw new BadRequestException("Monto inválido");

    const [funds] = await this.dataSource.query(
      `SELECT available_balance FROM funds WHERE user_id = $1::uuid FOR UPDATE`,
      [userId],
    );
    if (!funds || Number(funds.available_balance) < data.amount) {
      throw new BadRequestException("Saldo insuficiente");
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(
        `UPDATE funds SET available_balance = available_balance - $1, pending_balance = pending_balance + $1 WHERE user_id = $2::uuid`,
        [data.amount, userId],
      );
      await queryRunner.query(
        `INSERT INTO withdrawals (user_id, amount, status, bank_name, account_number, account_holder) VALUES ($1::uuid, $2, 'pending', $3, $4, $5)`,
        [userId, data.amount, data.bank_name, data.account_number, data.account_holder],
      );
      await queryRunner.commitTransaction();
      this.audit.log({ userId, action: "withdrawal_requested", entity: "funds", details: { amount: data.amount } });
      return { message: "Solicitud de retiro enviada" };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async processWithdrawal(id: string, status: string) {
    if (!["approved", "rejected"].includes(status)) throw new BadRequestException("Estado inválido");
    const [w] = await this.dataSource.query(
      `SELECT * FROM withdrawals WHERE id = $1::uuid`,
      [id],
    );
    if (!w) throw new NotFoundException("Retiro no encontrado");
    if (w.status !== "pending") throw new BadRequestException("El retiro ya fue procesado");

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (status === "rejected") {
        await queryRunner.query(
          `UPDATE funds SET available_balance = available_balance + $1, pending_balance = pending_balance - $1 WHERE user_id = $2::uuid`,
          [w.amount, w.user_id],
        );
      } else {
        await queryRunner.query(
          `UPDATE funds SET pending_balance = pending_balance - $1 WHERE user_id = $2::uuid`,
          [w.amount, w.user_id],
        );
      }
      await queryRunner.query(
        `UPDATE withdrawals SET status = $1, processed_at = NOW() WHERE id = $2::uuid`,
        [status, id],
      );
      await queryRunner.commitTransaction();
      this.audit.log({ action: "withdrawal_processed", entity: "funds", entityId: id, details: { status } });
      return { message: `Retiro ${status === "approved" ? "aprobado" : "rechazado"}` };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllWithdrawals(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const [{ count }] = await this.dataSource.query(
      `SELECT COUNT(*)::int FROM withdrawals`,
    );
    const rows = await this.dataSource.query(
      `SELECT w.*, up.first_name, up.last_name, u.email
       FROM withdrawals w
       LEFT JOIN users u ON u.id = w.user_id
       LEFT JOIN user_profiles up ON up.user_id = w.user_id
       ORDER BY w.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return { data: rows, total: Number(count), page, totalPages: Math.ceil(Number(count) / limit) };
  }

  async toggleWithdrawalDeposit(id: string) {
    const [w] = await this.dataSource.query(
      `SELECT * FROM withdrawals WHERE id = $1::uuid`,
      [id],
    );
    if (!w) throw new NotFoundException("Retiro no encontrado");
    if (w.status !== "approved" && w.status !== "completed") throw new BadRequestException("El retiro debe estar aprobado para gestionar el depósito");

    const newConfirmed = !w.deposit_confirmed;
    await this.dataSource.query(
      `UPDATE withdrawals SET deposit_confirmed = $1, deposit_confirmed_at = CASE WHEN $1 THEN NOW() ELSE NULL END, status = CASE WHEN $1 THEN 'completed' ELSE 'approved' END, updated_at = NOW() WHERE id = $2::uuid`,
      [newConfirmed, id],
    );
    this.audit.log({ action: "withdrawal_deposit_toggled", entity: "funds", entityId: id, details: { deposit_confirmed: newConfirmed } });
    return { message: newConfirmed ? "Depósito confirmado" : "Depósito marcado como pendiente" };
  }
}
