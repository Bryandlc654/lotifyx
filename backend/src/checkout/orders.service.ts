import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class OrdersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

  async getOrders(userId: string) {
    const sql = `SELECT o.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_title', p.title,
            'price', oi.price,
            'seller', CASE WHEN p.user_id IS NOT NULL THEN
              json_build_object(
                'id', p.user_id,
                'first_name', up.first_name,
                'last_name', up.last_name,
                'email', u.email,
                'phone', u.phone
              )
            ELSE NULL END
          )
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'
      ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN user_profiles up ON up.user_id = p.user_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 200`;

    const rows = await this.dataSource.query(sql, [userId]);
    const result = rows.map((row: any) => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    }));

    const orderIds = result.map((r: any) => r.id);
    const bidsForOrders = orderIds.length ? await this.dataSource.query(
      `SELECT ab.checkout_id, ab.monto AS bid_amount, a.ganador_id, a.estado AS auction_estado
       FROM auction_bids ab
       LEFT JOIN auctions a ON a.id = ab.auction_id
       WHERE ab.checkout_id = ANY($1)`,
      [orderIds],
    ) : [];
    const bidMap: Record<string, any> = {};
    for (const b of bidsForOrders) bidMap[b.checkout_id] = { bid_amount: b.bid_amount, ganador_id: b.ganador_id, auction_estado: b.auction_estado };

    for (const row of result) {
      row.bid_info = bidMap[row.id] || null;
    }
    return result;
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

    const sql = `SELECT o.*,
      buyer.email AS buyer_email,
      bup.first_name AS buyer_first_name,
      bup.last_name AS buyer_last_name,
      COALESCE(
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_title', p.title,
            'product_sku', p.sku,
            'price', oi.price,
            'seller', CASE WHEN p.user_id IS NOT NULL THEN
              json_build_object(
                'id', p.user_id,
                'first_name', up.first_name,
                'last_name', up.last_name,
                'email', u.email,
                'phone', u.phone
              )
            ELSE NULL END
          )
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'
      ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN user_profiles up ON up.user_id = p.user_id
      LEFT JOIN users buyer ON buyer.id = o.user_id
      LEFT JOIN user_profiles bup ON bup.user_id = o.user_id
      ${statusFilter}
      GROUP BY o.id, buyer.email, bup.first_name, bup.last_name
      ORDER BY o.created_at DESC
      LIMIT $${orderParams.length - 1} OFFSET $${orderParams.length}`;

    const rows = await this.dataSource.query(sql, orderParams);
    const result = rows.map((row: any) => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    }));

    const orderIds = result.map((r: any) => r.id);
    const bidsForOrders = orderIds.length ? await this.dataSource.query(
      `SELECT ab.checkout_id, ab.monto AS bid_amount, a.ganador_id, a.estado AS auction_estado
       FROM auction_bids ab
       LEFT JOIN auctions a ON a.id = ab.auction_id
       WHERE ab.checkout_id = ANY($1)`,
      [orderIds],
    ) : [];
    const bidMap: Record<string, any> = {};
    for (const b of bidsForOrders) bidMap[b.checkout_id] = { bid_amount: b.bid_amount, ganador_id: b.ganador_id, auction_estado: b.auction_estado };

    for (const row of result) {
      row.bid_info = bidMap[row.id] || null;
    }
    return {
      data: result,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
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

    const [bidInfo] = await this.dataSource.query(
      `SELECT ab.monto AS bid_amount, a.precio_inicial, a.incremento_minimo, a.fecha_fin,
              a.ganador_id, a.estado AS auction_estado
       FROM auction_bids ab
       INNER JOIN auctions a ON a.id = ab.auction_id
       WHERE ab.checkout_id = $1 AND ab.estado = 'confirmada'
       LIMIT 1`,
      [orderId],
    );

    const [remainingInfo] = await this.dataSource.query(
      `SELECT 1 FROM auctions WHERE remaining_order_id = $1 LIMIT 1`, [orderId]
    );

    return { ...order, ...sellerInfo, seller_id: sellerId, items, tracking_history: tracking, bid_info: bidInfo || null, remaining_balance: !!remainingInfo };
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
}
