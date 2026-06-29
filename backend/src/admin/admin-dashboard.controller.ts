import { Controller, Get, UseGuards } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";

let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 30000;

@Controller("admin/dashboard")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminDashboardController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Get()
  async getStats() {
    if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;

    const [usersAndProducts, ordersAndRevenue, recentUsers, recentProducts, recentOrders, salesByMonth, productsByCategory] = await Promise.all([
      this.ds.query(`SELECT (SELECT COUNT(*) FROM users)::int as u_total, (SELECT COUNT(*) FILTER (WHERE status='active') FROM users)::int as u_active, (SELECT COUNT(*) FILTER (WHERE status='pending_approval') FROM users)::int as u_pending, (SELECT COUNT(*) FROM products)::int as p_total, (SELECT COUNT(*) FILTER (WHERE status='active') FROM products)::int as p_active, (SELECT COUNT(*) FILTER (WHERE status='pending_approval') FROM products)::int as p_pending, (SELECT COUNT(*) FILTER (WHERE status='draft') FROM products)::int as p_draft`),
      this.ds.query(`SELECT (SELECT COUNT(*) FROM orders)::int as o_total, (SELECT COUNT(*) FILTER (WHERE status='pending_payment') FROM orders)::int as o_pending, (SELECT COUNT(*) FILTER (WHERE status='completed') FROM orders)::int as o_completed, COALESCE((SELECT SUM(total_amount) FROM orders WHERE status='completed'),0)::numeric as o_revenue`),
      this.ds.query(`SELECT u.id, u.email, u.created_at, up.first_name, up.last_name, u.status FROM users u LEFT JOIN user_profiles up ON up.user_id = u.id ORDER BY u.created_at DESC LIMIT 5`),
      this.ds.query(`SELECT id, title, sku, status, created_at FROM products ORDER BY created_at DESC LIMIT 5`),
      this.ds.query(`SELECT o.id, o.total_amount, o.status, o.created_at, u.email as buyer_email, up.first_name, up.last_name FROM orders o LEFT JOIN users u ON u.id = o.user_id LEFT JOIN user_profiles up ON up.user_id = o.user_id ORDER BY o.created_at DESC LIMIT 5`),
      this.ds.query(`SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*)::int as count, COALESCE(SUM(total_amount),0)::numeric as revenue FROM orders WHERE status='completed' GROUP BY month ORDER BY month DESC LIMIT 6`),
      this.ds.query(`SELECT c.name, COUNT(p.id)::int as count FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active' GROUP BY c.id, c.name ORDER BY count DESC LIMIT 5`),
    ]);

    const [up] = usersAndProducts;
    const [or] = ordersAndRevenue;

    const data = {
      users: { total: up.u_total, active: up.u_active, pending: up.u_pending },
      products: { total: up.p_total, active: up.p_active, pending: up.p_pending, draft: up.p_draft },
      orders: { total: or.o_total, pending: or.o_pending, completed: or.o_completed },
      revenue: or.o_revenue,
      recentUsers,
      recentProducts,
      recentOrders,
      salesByMonth: (salesByMonth || []).reverse(),
      productsByCategory,
    };

    cache = { data, ts: Date.now() };
    return data;
  }
}
