"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getMySales, isAuthenticated, removeTokens, getProfile } from "@/lib/api";
import { ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, Eye, User, Mail, Store } from "lucide-react";
import { toast } from "sonner";

interface Buyer {
  first_name: string; last_name: string; email: string;
}

interface SaleItem {
  id: string; product_id: string; product_title: string; product_sku: string; price: number;
}

interface Sale {
  id: string; user_id: string; total_amount: number; status: string;
  created_at: string; buyer: Buyer | null; items: SaleItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: "Pendiente de confirmación", color: "text-yellow-600 bg-yellow-50", icon: Clock },
  paid: { label: "Pagado", color: "text-blue-600 bg-blue-50", icon: CheckCircle },
  completed: { label: "Completado", color: "text-green-600 bg-green-50", icon: CheckCircle },
};

export default function MisVentasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [detail, setDetail] = useState<Sale | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then((data) => {
        const u = data.user as any;
        setUserRole(u.role?.name || "");
      })
      .catch(() => { removeTokens(); router.push("/"); });
    getMySales()
      .then(setSales)
      .catch(() => toast.error("Error al cargar ventas"))
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
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-compras")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Compras
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
              className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 border-l-2 border-slate-700 -ml-px">
              Mis Ventas
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
        </nav>

        <div className="max-w-4xl w-full">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">Inicio</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <button onClick={() => router.push("/perfil")} className="text-gray-400 hover:text-gray-600">Perfil</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-[#8234FE] font-semibold">Mis Ventas</span>
          </nav>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mis Ventas</h1>
            <p className="text-gray-500 text-sm mt-1">{sales.length} venta{sales.length !== 1 ? "s" : ""}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : sales.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">No tienes ventas aún</h3>
              <p className="text-sm text-gray-500 mb-6">Cuando alguien compre tus productos, aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map((sale) => {
                const cfg = statusConfig[sale.status] || { label: sale.status, color: "text-gray-600 bg-gray-50", icon: AlertCircle };
                const Icon = cfg.icon;
                return (
                  <div key={sale.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>
                        <button onClick={() => setDetail(sale)}
                          className="flex items-center gap-1 text-[10px] text-purple-600 hover:underline">
                          <Eye className="w-3 h-3" />
                          Detalle
                        </button>
                      </div>

                      {sale.buyer && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-3 bg-gray-50 rounded-lg p-2">
                          <User className="w-3 h-3 text-gray-400" />
                          {sale.buyer.first_name} {sale.buyer.last_name}
                          <span className="text-gray-300">·</span>
                          {sale.buyer.email}
                        </div>
                      )}

                      <div className="space-y-2">
                        {sale.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <Store className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                              <span className="text-gray-700 truncate">{item.product_title || "Producto"}</span>
                            </div>
                            <span className="font-semibold text-gray-800 flex-shrink-0 ml-2">S/ {Number(item.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-800">Total</span>
                        <span className="text-lg font-bold text-gray-900">S/ {Number(sale.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Detalle de Venta</h2>
              <button onClick={() => setDetail(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <XCircle className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <span className="font-medium">{statusConfig[detail.status]?.label || detail.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium">{new Date(detail.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>

              {detail.buyer && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-gray-500 block mb-2">Comprador</span>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                      <User className="w-3 h-3 text-purple-500" />
                      {detail.buyer.first_name} {detail.buyer.last_name}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Mail className="w-3 h-3" />
                      {detail.buyer.email}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100">
                <span className="text-gray-500 block mb-2">Productos</span>
                {detail.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-1">
                    <span className="text-gray-700">{item.product_title || "Producto"}</span>
                    <span className="font-medium">S/ {Number(item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-3 border-t border-gray-100 font-bold text-lg">
                <span>Total</span>
                <span>S/ {Number(detail.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
