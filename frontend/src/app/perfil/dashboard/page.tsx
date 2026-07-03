"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getDashboard, isAuthenticated, removeTokens, getProfile } from "@/lib/api";
import {
  ChevronRight, Package, ShoppingCart, DollarSign, Clock,
  CheckCircle, AlertCircle, TrendingUp, Plus, Eye, MessageCircle, Wallet,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardData {
  products: { total: number; active: number; pending: number; draft: number };
  sales: { total_sales: number; revenue: number; completed: number; pending_payment: number };
  recentOrders: { id: string; total_amount: number; status: string; created_at: string; product_title: string; item_price: number }[];
  recentProducts: { id: string; title: string; sku: string; status: string; created_at: string }[];
}

const statusLabels: Record<string, string> = {
  active: "Activo",
  pending_approval: "Pendiente",
  draft: "Borrador",
  pending_payment: "Pendiente pago",
  completed: "Completado",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then((d) => {
        const u = d.user as any;
        setUserRole(u.role?.name || "");
      })
      .catch(() => { removeTokens(); router.push("/"); });
    getDashboard()
      .then(setData)
      .catch(() => toast.error("Error al cargar dashboard"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 md:px-8 pt-24 md:pt-40 pb-8 flex items-start justify-center gap-32">
        <nav className="w-44 flex-shrink-0 pt-8 space-y-1">
          <button onClick={() => router.push("/perfil")}
            className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
            Editar Perfil
          </button>
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/dashboard")}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 border-l-2 border-slate-700 -ml-px">
              Dashboard
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-compras")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Compras
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mensajes")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mensajes
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-cuentas")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Cuentas
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-ventas")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Ventas
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-fondos")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Fondos
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/carga-masiva")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Carga Masiva
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-productos")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Productos
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/ofrecer")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Ofrecer
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mi-plan")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mi Plan
            </button>
          )}
        </nav>

        <div className="max-w-5xl w-full">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">Inicio</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <button onClick={() => router.push("/perfil")} className="text-gray-400 hover:text-gray-600">Perfil</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-[#8234FE] font-semibold">Dashboard</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard de Vendedor</h1>
            <p className="text-gray-500 text-sm mt-1">Resumen de tu actividad comercial</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : !data ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700">Error al cargar datos</h3>
            </div>
          ) : (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Productos</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{data.products.total}</p>
                  <div className="flex gap-2 mt-2 text-[10px] text-gray-500">
                    <span className="text-green-600">{data.products.active} activos</span>
                    <span>·</span>
                    <span className="text-yellow-600">{data.products.pending} pendientes</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Ventas</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{data.sales.total_sales}</p>
                  <div className="flex gap-2 mt-2 text-[10px] text-gray-500">
                    <span className="text-green-600">{data.sales.completed} completadas</span>
                    <span>·</span>
                    <span className="text-yellow-600">{data.sales.pending_payment} pendientes</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Ingresos</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">S/ {Number(data.sales.revenue).toFixed(2)}</p>
                  <p className="text-[10px] text-gray-500 mt-2">Total acumulado</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Acciones</span>
                  </div>
                  <div className="space-y-2 mt-1">
                    <button onClick={() => router.push("/perfil/ofrecer")}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-white py-2 rounded-lg transition-opacity hover:opacity-90"
                      style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
                      <Plus className="w-3.5 h-3.5" /> Nuevo producto
                    </button>
                    <button onClick={() => router.push("/perfil/mis-ventas")}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-600 py-2 rounded-lg border border-purple-200 hover:bg-purple-50">
                      <Eye className="w-3.5 h-3.5" /> Ver ventas
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Últimas ventas</h2>
                  <button onClick={() => router.push("/perfil/mis-ventas")}
                    className="text-xs text-purple-600 hover:underline">
                    Ver todas
                  </button>
                </div>
                {data.recentOrders.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aún no tienes ventas</p>
                ) : (
                  <div className="space-y-3">
                    {data.recentOrders.map(order => (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{order.product_title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleDateString("es-PE")}
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                              order.status === "completed" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                            }`}>
                              {statusLabels[order.status] || order.status}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-sm text-gray-900 ml-4">S/ {Number(order.item_price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent products */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Mis últimos productos</h2>
                  <button onClick={() => router.push("/perfil/mis-productos")}
                    className="text-xs text-purple-600 hover:underline">
                    Ver todos
                  </button>
                </div>
                {data.recentProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aún no tienes productos</p>
                ) : (
                  <div className="space-y-2">
                    {data.recentProducts.map(prod => (
                      <div key={prod.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-800 truncate">{prod.title}</p>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                              prod.status === "active" ? "bg-green-50 text-green-700"
                              : prod.status === "pending_approval" ? "bg-yellow-50 text-yellow-700"
                              : "bg-gray-50 text-gray-600"
                            }`}>
                              {statusLabels[prod.status] || prod.status}
                            </span>
                          </div>
                          {prod.sku && <p className="text-[10px] text-gray-400 mt-0.5">SKU: {prod.sku}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

