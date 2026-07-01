import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class CheckoutService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

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
        };
      }
      if (row.product_id) {
        grouped[row.id].items.push({
          id: row.item_id,
          product_id: row.product_id,
          product_title: row.product_title,
          price: row.item_price,
          seller: {
            id: row.seller_id,
            first_name: row.seller_first_name,
            last_name: row.seller_last_name,
            email: row.seller_email,
            phone: row.seller_phone,
          },
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
           COALESCE(SUM(oi.price), 0)::numeric as revenue,
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
        `UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [id],
      );

      await queryRunner.query(
        `UPDATE products SET stock = GREATEST(stock - 1, 0)
         WHERE id IN (SELECT product_id FROM order_items WHERE order_id = $1) AND stock > 0`,
        [id],
      );

      await queryRunner.commitTransaction();
      this.audit.log({ action: "order_approved", entity: "order", entityId: id });
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
    const productIds = data.items.map(i => i.id);

    const ownProducts = await this.dataSource.query(
      `SELECT id FROM products WHERE id = ANY($1) AND user_id = $2`,
      [productIds, data.userId],
    );

    if (ownProducts.length > 0) {
      throw new BadRequestException("No puedes comprar tus propios productos");
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const [order] = await queryRunner.query(
        `INSERT INTO orders (user_id, total_amount, status, origin_account_id, operation_number, amount, proof_image, created_at, updated_at)
         VALUES ($1, $2, 'pending_payment', $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [data.userId, data.total, data.originAccountId, data.operationNumber, data.amount, data.proofUrl],
      );

      const values = data.items.map((_, i) => `($1, $${2 + i * 2}, $${3 + i * 2}, NOW())`).join(", ");
      const params = [order.id];
      for (const item of data.items) { params.push(item.id, item.price); }
      await queryRunner.query(
        `INSERT INTO order_items (order_id, product_id, price, created_at) VALUES ${values}`,
        params,
      );

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
}
