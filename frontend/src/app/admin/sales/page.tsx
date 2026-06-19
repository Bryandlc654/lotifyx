"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminOrders, approveOrderPayment, rejectOrderPayment, getImageUrl } from "@/lib/api";
import { Check, Eye, Search, Store, Mail, Phone, User, X, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Seller {
  id: string; first_name: string; last_name: string; email: string; phone: string;
}

interface OrderItem {
  id: string; product_id: string; product_title: string; product_sku: string;
  price: number; seller: Seller | null;
}

interface Order {
  id: string; user_id: string; total_amount: number; status: string;
  operation_number: string; amount: number; proof_image: string;
  rejected_reason?: string;
  created_at: string; buyer: { first_name: string; last_name: string; email: string } | null;
  items: OrderItem[];
}

type Tab = "pending" | "completed" | "rejected";

const statusLabels: Record<string, string> = {
  pending_payment: "Pendiente de confirmación",
  paid: "Pagado",
  completed: "Completado",
  rejected: "Rechazado",
};

export default function AdminSalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Order | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => { load(); }, [tab]);

  async function load() {
    setLoading(true);
    try {
      const status = tab === "pending" ? "pending_payment" : tab === "completed" ? "completed" : "rejected";
      setOrders(await getAdminOrders(status));
    } catch {
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveOrderPayment(id);
      toast.success("Pago aprobado");
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch {
      toast.error("Error al aprobar");
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    if (!rejectMotivo.trim()) { toast.error("Escribe un motivo"); return; }
    setRejecting(true);
    try {
      await rejectOrderPayment(rejectTarget.id, rejectMotivo.trim());
      toast.success("Pago rechazado");
      setOrders(prev => prev.filter(o => o.id !== rejectTarget.id));
      setRejectTarget(null);
      setRejectMotivo("");
    } catch {
      toast.error("Error al rechazar");
    } finally {
      setRejecting(false);
    }
  }

  const filtered = orders.filter(o =>
    !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.operation_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ventas y Pagos</h1>
        </div>

        <div className="flex gap-1 mb-6">
          {(["pending", "completed", "rejected"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tab === t ? "bg-purple-600 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}>
              {t === "pending" ? "Pendientes" : t === "completed" ? "Completados" : "Rechazados"}
            </button>
          ))}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por ID o Nº operación..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No hay pedidos {tab === "pending" ? "pendientes" : tab === "completed" ? "completados" : "rechazados"}</div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-mono">{order.id.slice(0, 8)}...</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        order.status === "pending_payment" ? "bg-yellow-50 text-yellow-700"
                        : order.status === "completed" ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                      }`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setDetail(order)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                      <Eye className="w-4 h-4" />
                    </button>
                    {order.status === "pending_payment" && (
                      <>
                        <button onClick={() => handleApprove(order.id)}
                          className="flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100">
                          <Check className="w-3.5 h-3.5" />
                          Aprobar
                        </button>
                        <button onClick={() => { setRejectTarget(order); setRejectMotivo(""); }}
                          className="flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100">
                          <X className="w-3.5 h-3.5" />
                          Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {order.buyer && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-3 bg-gray-50 rounded-lg p-2">
                    <User className="w-3 h-3 text-gray-400" />
                    {order.buyer.first_name} {order.buyer.last_name}
                    <span className="text-gray-300">·</span>
                    {order.buyer.email}
                  </div>
                )}

                <div className="space-y-1.5">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Store className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{item.product_title || item.product_id.slice(0, 8)}</span>
                        {item.seller && (
                          <span className="text-[10px] text-gray-400 ml-1">
                            ({item.seller.first_name} {item.seller.last_name})
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-gray-800 flex-shrink-0 ml-2">S/ {Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.rejected_reason && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg p-2">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    {order.rejected_reason}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {order.operation_number && <>Nº Op: {order.operation_number}</>}
                  </span>
                  <span className="font-bold text-gray-900">Total: S/ {Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Detalle del Pedido</h2>
              <button onClick={() => setDetail(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <XCircle className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID</span>
                <span className="font-medium font-mono text-xs">{detail.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <span className="font-medium">{statusLabels[detail.status] || detail.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nº Operación</span>
                <span className="font-medium">{detail.operation_number || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monto transferido</span>
                <span className="font-medium">S/ {Number(detail.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium">{new Date(detail.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>

              {detail.rejected_reason && (
                <div className="bg-red-50 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-red-700 block">Motivo del rechazo</span>
                    <p className="text-xs text-red-600">{detail.rejected_reason}</p>
                  </div>
                </div>
              )}

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

              {detail.proof_image && (
                <div>
                  <span className="text-gray-500 block mb-2">Comprobante</span>
                  <img src={getImageUrl(detail.proof_image)} alt="Comprobante" className="rounded-lg border max-h-48 w-full object-contain bg-gray-50" />
                </div>
              )}

              <div className="pt-3 border-t border-gray-100">
                <span className="text-gray-500 block mb-2">Productos</span>
                {detail.items.map((item) => (
                  <div key={item.id} className="mb-2">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-700">{item.product_title || "Producto"}</span>
                      <span className="font-medium">S/ {Number(item.price).toFixed(2)}</span>
                    </div>
                    {item.seller && (
                      <div className="ml-2 bg-gray-50 rounded-lg p-3 space-y-1">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Vendedor</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <Store className="w-3 h-3 text-purple-500" />
                          {item.seller.first_name} {item.seller.last_name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          {item.seller.email}
                        </div>
                        {item.seller.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            {item.seller.phone}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-3 border-t border-gray-100 font-bold text-lg">
                <span>Total</span>
                <span>S/ {Number(detail.total_amount).toFixed(2)}</span>
              </div>

              {detail.status === "pending_payment" && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { handleApprove(detail.id); setDetail(null); }}
                    className="flex-1 text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
                    Aprobar pago
                  </button>
                  <button onClick={() => { setRejectTarget(detail); setRejectMotivo(""); setDetail(null); }}
                    className="px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setRejectTarget(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Rechazar Pago</h2>
              <button onClick={() => setRejectTarget(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700">Motivo del rechazo <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectMotivo}
                  onChange={e => setRejectMotivo(e.target.value)}
                  placeholder="Explica el motivo del rechazo..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-red-500 focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleReject} disabled={rejecting}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60">
                  {rejecting ? "Rechazando..." : "Confirmar rechazo"}
                </button>
                <button onClick={() => setRejectTarget(null)}
                  className="px-6 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
