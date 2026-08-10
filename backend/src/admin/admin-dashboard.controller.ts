import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Response } from "express";
import * as XLSX from "xlsx";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";

let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 30000;

function csvCell(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: any[][]): string {
  return "\uFEFF" + rows.map(r => r.map(csvCell).join(",")).join("\r\n");
}

@Controller("admin/dashboard")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminDashboardController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Get()
  async getStats() {
    if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;

    const [usersAndProducts, ordersAndRevenue, recentUsers, recentProducts, recentOrders, salesByMonth, productsByCategory] = await Promise.all([
      this.ds.query(`SELECT (SELECT COUNT(*) FROM users)::int as u_total, (SELECT COUNT(*) FILTER (WHERE status='active') FROM users)::int as u_active, (SELECT COUNT(*) FILTER (WHERE status='pending_approval') FROM users)::int as u_pending, (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL)::int as p_total, (SELECT COUNT(*) FILTER (WHERE status='active') FROM products WHERE deleted_at IS NULL)::int as p_active, (SELECT COUNT(*) FILTER (WHERE status='pending_approval') FROM products WHERE deleted_at IS NULL)::int as p_pending, (SELECT COUNT(*) FILTER (WHERE status='draft') FROM products WHERE deleted_at IS NULL)::int as p_draft`),
      this.ds.query(`SELECT (SELECT COUNT(*) FROM orders)::int as o_total, (SELECT COUNT(*) FILTER (WHERE status='pending_payment') FROM orders)::int as o_pending, (SELECT COUNT(*) FILTER (WHERE status='completed') FROM orders)::int as o_completed, COALESCE((SELECT SUM(total_amount) FROM orders WHERE status='completed'),0)::numeric as o_revenue`),
      this.ds.query(`SELECT u.id, u.email, u.created_at, up.first_name, up.last_name, u.status FROM users u LEFT JOIN user_profiles up ON up.user_id = u.id ORDER BY u.created_at DESC LIMIT 5`),
      this.ds.query(`SELECT id, title, sku, status, created_at FROM products WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5`),
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

  @Get("export")
  async exportMetrics(@Query("format") format: string | undefined, @Res() res: Response) {
    const fmt = format === "csv" ? "csv" : "xlsx";

    const [usersSummary, productsSummary, ordersSummary, salesByMonth, usersByMonth, productsByCategory, allUsers, allProducts, allOrders] = await Promise.all([
      this.ds.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='active')::int AS active, COUNT(*) FILTER (WHERE status='pending_approval')::int AS pending_approval, COUNT(*) FILTER (WHERE status='pending_verification')::int AS pending_verification, COUNT(*) FILTER (WHERE status='disabled')::int AS disabled, COUNT(*) FILTER (WHERE is_verified)::int AS verified FROM users`),
      this.ds.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='active')::int AS active, COUNT(*) FILTER (WHERE status='pending_approval')::int AS pending, COUNT(*) FILTER (WHERE status='draft')::int AS draft, COUNT(*) FILTER (WHERE status='disabled')::int AS disabled FROM products WHERE deleted_at IS NULL`),
      this.ds.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='completed')::int AS completed, COUNT(*) FILTER (WHERE status='pending_payment')::int AS pending_payment, COUNT(*) FILTER (WHERE status='cancelled')::int AS cancelled, COALESCE(SUM(total_amount) FILTER (WHERE status='completed'),0)::numeric AS revenue FROM orders`),
      this.ds.query(`SELECT TO_CHAR(created_at,'YYYY-MM') AS month, COUNT(*)::int AS orders, COALESCE(SUM(total_amount),0)::numeric AS revenue FROM orders WHERE status='completed' GROUP BY 1 ORDER BY 1`),
      this.ds.query(`SELECT TO_CHAR(created_at,'YYYY-MM') AS month, COUNT(*)::int AS users FROM users GROUP BY 1 ORDER BY 1`),
      this.ds.query(`SELECT c.name AS category, COUNT(p.id)::int AS products FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.status='active' AND p.deleted_at IS NULL GROUP BY c.id, c.name ORDER BY products DESC`),
      this.ds.query(`SELECT u.id, u.email, u.phone, u.status, u.is_verified, u.created_at, up.first_name, up.last_name, up.document_type, up.document_number, r.name AS role FROM users u LEFT JOIN user_profiles up ON up.user_id = u.id LEFT JOIN roles r ON r.id = u.role_id ORDER BY u.created_at DESC`),
      this.ds.query(`SELECT id, title, sku, metodo_pago, COALESCE(precio_inicial, 0)::float AS price, stock, views, saves_count, status, created_at FROM products WHERE deleted_at IS NULL ORDER BY created_at DESC`),
      this.ds.query(`SELECT o.id, o.total_amount, o.status, o.created_at, u.email AS buyer_email, up.first_name, up.last_name FROM orders o LEFT JOIN users u ON u.id = o.user_id LEFT JOIN user_profiles up ON up.user_id = o.user_id ORDER BY o.created_at DESC`),
    ]);

    const [us] = usersSummary;
    const [ps] = productsSummary;
    const [os] = ordersSummary;
    const date = new Date().toISOString().slice(0, 10);

    if (fmt === "csv") {
      const rows: any[][] = [
        ["MÉTRICAS DE LA PLATAFORMA - LOTIFYX"],
        [`Generado el ${new Date().toLocaleString("es-PE")}`],
        [],
        ["RESUMEN", "Valor"],
        ["Usuarios totales", us.total],
        ["Usuarios activos", us.active],
        ["Usuarios pendientes de aprobación", us.pending_approval],
        ["Usuarios pendientes de verificación", us.pending_verification],
        ["Usuarios deshabilitados", us.disabled],
        ["Usuarios con correo verificado", us.verified],
        ["Productos totales", ps.total],
        ["Productos activos", ps.active],
        ["Productos pendientes", ps.pending],
        ["Productos borrador", ps.draft],
        ["Productos deshabilitados", ps.disabled],
        ["Pedidos totales", os.total],
        ["Pedidos completados", os.completed],
        ["Pedidos pendientes de pago", os.pending_payment],
        ["Pedidos cancelados", os.cancelled],
        ["Ingresos totales (S/)", Number(os.revenue).toFixed(2)],
        [],
        ["VENTAS POR MES"],
        ["Mes", "Pedidos", "Ingresos (S/)"],
        ...salesByMonth.map((r: any) => [r.month, r.orders, Number(r.revenue).toFixed(2)]),
        [],
        ["USUARIOS POR MES"],
        ["Mes", "Usuarios nuevos"],
        ...usersByMonth.map((r: any) => [r.month, r.users]),
        [],
        ["PRODUCTOS POR CATEGORÍA"],
        ["Categoría", "Productos activos"],
        ...productsByCategory.map((r: any) => [r.category, r.products]),
        [],
        ["USUARIOS"],
        ["ID", "Correo", "Teléfono", "Nombres", "Apellidos", "Documento", "Rol", "Estado", "Verificado", "Fecha registro"],
        ...allUsers.map((r: any) => [r.id, r.email, r.phone, r.first_name, r.last_name, `${r.document_type || ""} ${r.document_number || ""}`.trim(), r.role, r.status, r.is_verified ? "Sí" : "No", r.created_at ? new Date(r.created_at).toISOString() : ""]),
        [],
        ["PRODUCTOS"],
        ["ID", "Título", "SKU", "Método de pago", "Precio (S/)", "Stock", "Vistas", "Guardados", "Estado", "Fecha creación"],
        ...allProducts.map((r: any) => [r.id, r.title, r.sku, r.metodo_pago, Number(r.price).toFixed(2), r.stock, r.views, r.saves_count, r.status, r.created_at ? new Date(r.created_at).toISOString() : ""]),
        [],
        ["PEDIDOS"],
        ["ID", "Monto (S/)", "Estado", "Comprador", "Correo", "Fecha"],
        ...allOrders.map((r: any) => [r.id, Number(r.total_amount).toFixed(2), r.status, `${r.first_name || ""} ${r.last_name || ""}`.trim(), r.buyer_email, r.created_at ? new Date(r.created_at).toISOString() : ""]),
      ];
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="metricas-lotifyx-${date}.csv"`);
      res.send(toCsv(rows));
      return;
    }

    const wb = XLSX.utils.book_new();
    const addSheet = (name: string, headers: string[], rows: any[][]) => {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = headers.map(h => ({ wch: Math.max(12, h.length + 2) }));
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet("Resumen", ["Métrica", "Valor"], [
      ["Usuarios totales", us.total],
      ["Usuarios activos", us.active],
      ["Usuarios pendientes de aprobación", us.pending_approval],
      ["Usuarios pendientes de verificación", us.pending_verification],
      ["Usuarios deshabilitados", us.disabled],
      ["Usuarios con correo verificado", us.verified],
      ["Productos totales", ps.total],
      ["Productos activos", ps.active],
      ["Productos pendientes", ps.pending],
      ["Productos borrador", ps.draft],
      ["Productos deshabilitados", ps.disabled],
      ["Pedidos totales", os.total],
      ["Pedidos completados", os.completed],
      ["Pedidos pendientes de pago", os.pending_payment],
      ["Pedidos cancelados", os.cancelled],
      ["Ingresos totales (S/)", Number(os.revenue).toFixed(2)],
    ]);
    addSheet("Ventas por mes", ["Mes", "Pedidos", "Ingresos (S/)"], salesByMonth.map((r: any) => [r.month, r.orders, Number(r.revenue).toFixed(2)]));
    addSheet("Usuarios por mes", ["Mes", "Usuarios nuevos"], usersByMonth.map((r: any) => [r.month, r.users]));
    addSheet("Productos por categoría", ["Categoría", "Productos activos"], productsByCategory.map((r: any) => [r.category, r.products]));
    addSheet("Usuarios", ["ID", "Correo", "Teléfono", "Nombres", "Apellidos", "Documento", "Rol", "Estado", "Verificado", "Fecha registro"], allUsers.map((r: any) => [r.id, r.email, r.phone, r.first_name, r.last_name, `${r.document_type || ""} ${r.document_number || ""}`.trim(), r.role, r.status, r.is_verified ? "Sí" : "No", r.created_at ? new Date(r.created_at).toISOString() : ""]));
    addSheet("Productos", ["ID", "Título", "SKU", "Método de pago", "Precio (S/)", "Stock", "Vistas", "Guardados", "Estado", "Fecha creación"], allProducts.map((r: any) => [r.id, r.title, r.sku, r.metodo_pago, Number(r.price).toFixed(2), r.stock, r.views, r.saves_count, r.status, r.created_at ? new Date(r.created_at).toISOString() : ""]));
    addSheet("Pedidos", ["ID", "Monto (S/)", "Estado", "Comprador", "Correo", "Fecha"], allOrders.map((r: any) => [r.id, Number(r.total_amount).toFixed(2), r.status, `${r.first_name || ""} ${r.last_name || ""}`.trim(), r.buyer_email, r.created_at ? new Date(r.created_at).toISOString() : ""]));

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="metricas-lotifyx-${date}.xlsx"`);
    res.send(buffer);
  }
}
