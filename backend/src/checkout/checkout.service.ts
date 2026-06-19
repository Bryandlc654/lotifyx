import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class CheckoutService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getOrders(userId: string) {
    const orders = await this.dataSource.query(
      `SELECT o.*, oi.id as item_id, oi.product_id, oi.price as item_price,
              p.user_id as seller_id,
              up.first_name as seller_first_name, up.last_name as seller_last_name,
              u.email as seller_email, u.phone as seller_phone
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       LEFT JOIN users u ON u.id = p.user_id
       LEFT JOIN user_profiles up ON up.user_id = p.user_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
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

  async findAllOrders(status?: string) {
    const statusFilter = status ? `WHERE o.status = $1` : "";
    const params = status ? [status] : [];
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
       ORDER BY o.created_at DESC`,
      params,
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
    return Object.values(grouped);
  }

  async approveOrder(id: string) {
    await this.dataSource.query(
      `UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [id],
    );
    return { message: "Pago aprobado correctamente" };
  }

  async rejectOrder(id: string, motivo: string) {
    await this.dataSource.query(
      `UPDATE orders SET status = 'rejected', rejected_reason = $2, updated_at = NOW() WHERE id = $1`,
      [id, motivo],
    );
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
       ORDER BY o.created_at DESC`,
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

      for (const item of data.items) {
        await queryRunner.query(
          `INSERT INTO order_items (order_id, product_id, price, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [order.id, item.id, item.price],
        );
      }

      await queryRunner.commitTransaction();
      return order;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
