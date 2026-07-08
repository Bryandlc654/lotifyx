"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getMyOrders, getImageUrl, isAuthenticated, removeTokens, getProfile, getCurrentUserId } from "@/lib/api";
import { ShoppingBag, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, Eye, Store, Mail, Phone, MessageCircle, Wallet, Star } from "lucide-react";
import { toast } from "sonner";

interface Seller {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_title?: string;
  price: number;
  seller?: Seller;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  operation_number: string;
  amount: number;
  proof_image: string;
  created_at: string;
  items: OrderItem[];
  bid_info?: { bid_amount: number; ganador_id?: string | null; auction_estado?: string } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: "Pendiente de confirmación de pago", color: "text-yellow-600 bg-yellow-50", icon: Clock },
  paid: { label: "Pagado", color: "text-blue-600 bg-blue-50", icon: CheckCircle },
  completed: { label: "Completado", color: "text-green-600 bg-green-50", icon: CheckCircle },
  rejected: { label: "Rechazado", color: "text-red-600 bg-red-50", icon: XCircle },
};

export default function MisComprasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const router = useRouter();

  async function loadOrders() {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch {
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then((data) => {
        const u = data.user as any;
        setUserRole(u.role?.name || "");
      })
      .catch(() => { removeTokens(); router.push("/"); });
    loadOrders();
  }, [router]);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("es-PE", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

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
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Dashboard
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-compras")}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 border-l-2 border-slate-700 -ml-px">
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
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-resenas")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Reseñas
            </button>
          )}
        </nav>

        <div className="max-w-4xl w-full">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">Inicio</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <button onClick={() => router.push("/perfil")} className="text-gray-400 hover:text-gray-600">Perfil</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-[#8234FE] font-semibold">Mis Compras</span>
          </nav>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mis Compras</h1>
            <p className="text-gray-500 text-sm mt-1">{orders.length} pedido{orders.length !== 1 ? "s" : ""}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">No tienes compras aún</h3>
              <p className="text-sm text-gray-500 mb-6">Explora nuestros productos y realiza tu primera compra.</p>
              <button onClick={() => router.push("/categorias")}
                className="inline-block text-white font-semibold py-2 px-6 rounded-xl transition-opacity hover:opacity-90" style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
                Ir a comprar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const cfg = statusConfig[order.status] || { label: order.status, color: "text-gray-600 bg-gray-50", icon: AlertCircle };
                const Icon = cfg.icon;
                const showChat = order.items[0]?.seller?.id && (!order.bid_info || (order.bid_info.ganador_id && getCurrentUserId() === order.bid_info.ganador_id));
                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>
                        <button onClick={() => {
                          if (order.status === "completed") {
                            router.push(`/perfil/pedido/${order.id}`);
                          } else {
                            setSelectedOrder(order);
                          }
                        }}
                          className="flex items-center gap-1 text-[10px] text-purple-600 hover:underline">
                          <Eye className="w-3 h-3" />
                          Detalle
                        </button>
                        <button onClick={() => router.push(`/perfil/reclamo/${order.id}`)}
                          className="flex items-center gap-1 text-[10px] text-orange-600 hover:underline ml-2">
                          <AlertCircle className="w-3 h-3" />
                          Reclamo
                        </button>
                        {order.status === "completed" && (
                          <button onClick={() => router.push(`/perfil/mis-compras/resena/${order.id}`)}
                            className="flex items-center gap-1 text-[10px] text-green-600 hover:underline ml-2">
                            <Star className="w-3 h-3" />
                            Reseña
                          </button>
                        )}
                        {showChat && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const { createOrGetConversation } = await import("@/lib/api");
                                const item = order.items[0];
                                const conv = await createOrGetConversation(item.seller!.id, item.product_id);
                                router.push(`/perfil/mensajes?conv=${conv.id}`);
                              } catch { toast.error("Error al abrir chat"); }
                            }}
                            className="flex items-center gap-1 text-[10px] text-purple-600 hover:underline ml-2">
                            <MessageCircle className="w-3 h-3" />
                            Chat
                          </button>
                        )}
                      </div>

                      {order.bid_info && (
                        <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg p-2.5 mb-3">
                          <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0l0 0a2.12 2.12 0 0 1 0-3L11 10" />
                            <path d="m16 16 3.5 3.5c.83.83 2.17.83 3 0l0 0a2.12 2.12 0 0 0 0-3L19 13" />
                            <path d="m15 11 3-3" /><path d="m8 4 3 3" /><path d="m2 2 16 16" /><path d="m2 11 9-9" />
                          </svg>
                          <div>
                            <p className="text-xs font-semibold text-purple-700">Subasta - Puja de S/ {Number(order.bid_info.bid_amount).toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.product_title || "Producto"}</span>
                            <span className="font-semibold text-gray-800">S/ {Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
               </div>

                       <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-800">Total</span>
                        <span className="text-lg font-bold text-gray-900">S/ {Number(order.total_amount).toFixed(2)}</span>
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

      {/* Detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Detalle del Pedido</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <XCircle className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nº Operación</span>
                <span className="font-medium">{selectedOrder.operation_number || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monto transferido</span>
                <span className="font-medium">S/ {Number(selectedOrder.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <span className="font-medium">{statusConfig[selectedOrder.status]?.label || selectedOrder.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium">{formatDate(selectedOrder.created_at)}</span>
              </div>
              {selectedOrder.proof_image && (
                <div>
                  <span className="text-gray-500 block mb-2">Comprobante</span>
                  <img src={getImageUrl(selectedOrder.proof_image)} alt="Comprobante" className="rounded-lg border max-h-48 w-full object-contain bg-gray-50" />
                </div>
              )}
              <div className="pt-3 border-t border-gray-100">
                <span className="text-gray-500 block mb-2">Productos</span>
                {selectedOrder.items.map((item) => {
                  const showSeller = item.seller && (!selectedOrder.bid_info || (selectedOrder.bid_info.ganador_id && getCurrentUserId() === selectedOrder.bid_info.ganador_id));
                  return (
                  <div key={item.id}>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-700">{item.product_title || "Producto"}</span>
                      <span className="font-medium">S/ {Number(item.price).toFixed(2)}</span>
                    </div>
                    {showSeller && (
                       <div className="ml-2 mb-2 bg-gray-50 rounded-lg p-3 space-y-1">
                         <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Vendedor</p>
                         <div className="flex items-center gap-1.5 text-xs text-gray-700">
                           <Store className="w-3 h-3 text-purple-500" />
                           {item.seller.first_name} {item.seller.last_name}
                         </div>
                         {item.seller.email && (
                           <div className="flex items-center gap-1.5 text-xs text-gray-500">
                             <Mail className="w-3 h-3" />
                             {item.seller.email}
                           </div>
                         )}
                         {item.seller.phone && (
                           <div className="flex items-center gap-1.5 text-xs text-gray-500">
                             <Phone className="w-3 h-3" />
                             {item.seller.phone}
                           </div>
                         )}
                         <button
                           onClick={async (e) => {
                             e.stopPropagation();
                             try {
                               const { createOrGetConversation } = await import("@/lib/api");
                               const conv = await createOrGetConversation(item.seller!.id, item.product_id);
                               router.push(`/perfil/mensajes?conv=${conv.id}`);
                             } catch { toast.error("Error al abrir chat"); }
                           }}
                           className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium mt-1"
                         >
                           <MessageCircle className="w-3 h-3" />
                           Chat con vendedor
                         </button>
                       </div>
                     )}
                   </div>
                 );
               })}
               </div>
               <div className="flex justify-between pt-3 border-t border-gray-100 font-bold text-lg">
                <span>Total</span>
                <span>S/ {Number(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

