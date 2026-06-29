"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminDashboard } from "@/lib/api";
import {
  Users, Package, ShoppingCart, DollarSign, TrendingUp,
  Clock, CheckCircle, BarChart3, Activity,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardData {
  users: { total: number; active: number; pending: number };
  products: { total: number; active: number; pending: number; draft: number };
  orders: { total: number; pending: number; completed: number };
  revenue: number;
  recentUsers: { id: string; email: string; first_name: string; last_name: string; status: string; created_at: string }[];
  recentProducts: { id: string; title: string; sku: string; status: string; created_at: string }[];
  recentOrders: { id: string; total_amount: number; status: string; buyer_email: string; first_name: string; last_name: string; created_at: string }[];
  salesByMonth: { month: string; count: number; revenue: number }[];
  productsByCategory: { name: string; count: number }[];
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex-1">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch(() => toast.error("Error al cargar dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-32">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) return null;

  const maxSalesRevenue = Math.max(...data.salesByMonth.map(m => Number(m.revenue)), 1);
  const maxCatProducts = Math.max(...data.productsByCategory.map(c => c.count), 1);

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Activity className="h-3 w-3" /> Última actualización: ahora
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-8">Resumen general de la plataforma</p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.users.total}</p>
            <p className="text-[10px] text-gray-500 mt-1">{data.users.active} activos · {data.users.pending} pendientes</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.products.total}</p>
            <p className="text-[10px] text-gray-500 mt-1">{data.products.active} activos · {data.products.pending + data.products.draft} pendientes</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.orders.total}</p>
            <p className="text-[10px] text-gray-500 mt-1">{data.orders.completed} completadas · {data.orders.pending} pendientes</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">S/ {Number(data.revenue).toFixed(0)}</p>
            <p className="text-[10px] text-gray-500 mt-1">Ingresos totales</p>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales by month */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Ventas por mes (S/)</h2>
            {data.salesByMonth.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {data.salesByMonth.map(m => (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16 flex-shrink-0">{m.month}</span>
                    <Bar value={Number(m.revenue)} max={maxSalesRevenue} color="bg-purple-500" />
                    <span className="text-xs font-medium text-gray-700 w-16 text-right">S/ {Number(m.revenue).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Products by category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Productos por categoría</h2>
            {data.productsByCategory.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {data.productsByCategory.map(c => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 flex-shrink-0 truncate">{c.name}</span>
                    <Bar value={c.count} max={maxCatProducts} color="bg-blue-500" />
                    <span className="text-xs font-medium text-gray-700 w-10 text-right">{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" /> Últimos usuarios
            </h2>
            <div className="space-y-3">
              {data.recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-700 truncate">{u.first_name ? `${u.first_name} ${u.last_name}` : u.email}</p>
                    <p className="text-gray-400">{new Date(u.created_at).toLocaleDateString("es-PE")}</p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                    u.status === "active" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                  }`}>{u.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" /> Últimos productos
            </h2>
            <div className="space-y-3">
              {data.recentProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-700 truncate">{p.title}</p>
                    <p className="text-gray-400">{p.sku || "—"} · {new Date(p.created_at).toLocaleDateString("es-PE")}</p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                    p.status === "active" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                  }`}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-green-500" /> Últimos pedidos
            </h2>
            <div className="space-y-3">
              {data.recentOrders.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">Sin pedidos aún</p>
              ) : (
                data.recentOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-700 truncate">{o.first_name ? `${o.first_name} ${o.last_name}` : o.buyer_email || "—"}</p>
                      <p className="text-gray-400">S/ {Number(o.total_amount).toFixed(2)} · {new Date(o.created_at).toLocaleDateString("es-PE")}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                      o.status === "completed" ? "bg-green-50 text-green-700" : o.status === "pending_payment" ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-600"
                    }`}>{o.status === "completed" ? "Completado" : o.status === "pending_payment" ? "Pendiente" : o.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
