"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminOrders, approveOrderPayment, rejectOrderPayment, updateOrderStatus, getImageUrl } from "@/lib/api";
import { Check, Eye, Search, Store, Mail, Phone, User, X, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Seller {
  id: string; first_name: string; last_name: string; email: string; phone: string;
}

interface OrderItem {
  id: string; product_id: string; product_title: string; product_sku: string;
  price: number; seller?: Seller | null;
}

interface Order {
  id: string; user_id: string; total_amount: number; status: string;
  operation_number: string; amount: number; proof_image: string;
  rejected_reason?: string;
  created_at: string; buyer: { first_name: string; last_name: string; email: string } | null;
  items: OrderItem[];
  bid_info?: { bid_amount: number; ganador_id?: string | null; auction_estado?: string } | null;
}

const STATUS_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "pending_payment", label: "Pendientes" },
  { value: "completed", label: "Completados" },
  { value: "rejected", label: "Rechazados" },
];

const statusLabels: Record<string, string> = {
  pending_payment: "Pendiente",
  paid: "Pagado",
  completed: "Completado",
  rejected: "Rechazado",
};

const statusColor: Record<string, string> = {
  pending_payment: "bg-yellow-50 text-yellow-700",
  completed: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  paid: "bg-blue-50 text-blue-700",
};

export default function AdminSalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_payment");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Order | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => { load(); }, [statusFilter, page]);

  async function load() {
    setLoading(true);
    try {
      const status = statusFilter === "all" ? "" : statusFilter;
      const res = await getAdminOrders(status || undefined, page);
      setOrders(res.data);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
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
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "completed" } : o));
    } catch {
      toast.error("Error al aprobar");
    }
  }

  async function handleReject() {
    if (!rejectTarget || !rejectMotivo.trim()) return;
    setRejecting(true);
    try {
      await rejectOrderPayment(rejectTarget.id, rejectMotivo.trim());
      toast.success("Pago rechazado");
      setOrders(prev => prev.map(o => o.id === rejectTarget.id ? { ...o, status: "rejected", rejected_reason: rejectMotivo.trim() } : o));
      setRejectTarget(null);
      setRejectMotivo("");
    } catch {
      toast.error("Error al rechazar");
    } finally {
      setRejecting(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      await updateOrderStatus(id, newStatus);
      toast.success("Estado actualizado");
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch {
      toast.error("Error al actualizar estado");
    }
  }

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch = !search || o.id.includes(search) || (o.operation_number || "").includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ventas y Pagos</h1>
          <span className="text-sm text-gray-400">{totalItems} pedido{totalItems !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por ID o Nº operación..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200">
            {STATUS_FILTERS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No se encontraron pedidos</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Comprador</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Productos</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Total</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <span className="text-xs font-mono text-gray-400">{order.id.slice(0, 8)}...</span>
                        {order.operation_number && <p className="text-[10px] text-gray-400 mt-0.5">Op: {order.operation_number}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                          className={`text-[10px] font-medium rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-1 focus:ring-purple-300 ${statusColor[order.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          <option value="pending_payment">Pendiente</option>
                          <option value="paid">Pagado</option>
                          <option value="completed">Completado</option>
                          <option value="rejected">Rechazado</option>
                        </select>
                        {order.rejected_reason && (
                          <p className="text-[10px] text-red-500 max-w-[100px] truncate">{order.rejected_reason}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      {order.buyer ? (
                        <div>
                          <p className="text-xs font-medium text-gray-700">{order.buyer.first_name} {order.buyer.last_name}</p>
                          <p className="text-[10px] text-gray-400">{order.buyer.email}</p>
                        </div>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="space-y-0.5">
                        {order.bid_info && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full mb-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0l0 0a2.12 2.12 0 0 1 0-3L11 10" />
                              <path d="m16 16 3.5 3.5c.83.83 2.17.83 3 0l0 0a2.12 2.12 0 0 0 0-3L19 13" />
                              <path d="m15 11 3-3" /><path d="m8 4 3 3" />
                            </svg>
                            Subasta S/ {Number(order.bid_info.bid_amount).toFixed(2)}
                          </span>
                        )}
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-xs gap-2">
                            <span className="text-gray-700 truncate max-w-[140px]">{item.product_title || "Producto"}</span>
                            <span className="text-gray-500 flex-shrink-0">S/ {Number(item.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-sm font-bold text-gray-900">S/ {Number(order.total_amount).toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end items-center">
                        <button onClick={() => setDetail(order)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalles">
                          <Eye className="h-4 w-4" />
                        </button>
                        {order.status === "pending_payment" && (
                          <>
                            <button onClick={() => handleApprove(order.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Aprobar">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => { setRejectTarget(order); setRejectMotivo(""); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Rechazar">
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-400">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Anterior
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Siguiente
              </button>
            </div>
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
              <div className="flex justify-between"><span className="text-gray-500">ID</span><span className="font-medium font-mono text-xs">{detail.id}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Estado</span><span className="font-medium">{statusLabels[detail.status] || detail.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Nº Operación</span><span className="font-medium">{detail.operation_number || "-"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Monto</span><span className="font-medium">S/ {Number(detail.amount).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fecha</span><span className="font-medium">{new Date(detail.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>

              {detail.rejected_reason && (
                <div className="bg-red-50 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div><span className="text-xs font-semibold text-red-700 block">Motivo del rechazo</span><p className="text-xs text-red-600">{detail.rejected_reason}</p></div>
                </div>
              )}

              {detail.buyer && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-gray-500 block mb-2">Comprador</span>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700"><User className="w-3 h-3 text-purple-500" />{detail.buyer.first_name} {detail.buyer.last_name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="w-3 h-3" />{detail.buyer.email}</div>
                  </div>
                </div>
              )}

              {detail.proof_image && (
                <div><span className="text-gray-500 block mb-2">Comprobante</span><img src={getImageUrl(detail.proof_image)} alt="Comprobante" className="rounded-lg border max-h-48 w-full object-contain bg-gray-50" /></div>
              )}

              {detail.bid_info && (
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg p-2.5 mb-3">
                  <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0l0 0a2.12 2.12 0 0 1 0-3L11 10" />
                    <path d="m16 16 3.5 3.5c.83.83 2.17.83 3 0l0 0a2.12 2.12 0 0 0 0-3L19 13" />
                    <path d="m15 11 3-3" /><path d="m8 4 3 3" /><path d="m2 2 16 16" /><path d="m2 11 9-9" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-purple-700">Subasta - Puja de S/ {Number(detail.bid_info.bid_amount).toFixed(2)}</p>
                  </div>
                </div>
              )}
              <div className="pt-3 border-t border-gray-100">
                <span className="text-gray-500 block mb-2">Productos</span>
                {detail.items.map((item) => (
                  <div key={item.id} className="mb-2">
                    <div className="flex justify-between py-1"><span className="text-gray-700">{item.product_title || "Producto"}</span><span className="font-medium">S/ {Number(item.price).toFixed(2)}</span></div>
                    {item.seller != null && (
                      <div className="ml-2 bg-gray-50 rounded-lg p-3 space-y-1">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Vendedor</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-700"><Store className="w-3 h-3 text-purple-500" />{item.seller!.first_name} {item.seller!.last_name}</div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="w-3 h-3" />{item.seller!.email}</div>
                        {item.seller!.phone && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="w-3 h-3" />{item.seller!.phone}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-3 border-t border-gray-100 font-bold text-lg"><span>Total</span><span>S/ {Number(detail.total_amount).toFixed(2)}</span></div>

              {detail.status === "pending_payment" && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { handleApprove(detail.id); setDetail(null); }} className="flex-1 text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90" style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>Aprobar pago</button>
                  <button onClick={() => { setRejectTarget(detail); setRejectMotivo(""); setDetail(null); }} className="px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">Rechazar</button>
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
              <button onClick={() => setRejectTarget(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700">Motivo del rechazo <span className="text-red-500">*</span></label>
                <textarea value={rejectMotivo} onChange={e => setRejectMotivo(e.target.value)} placeholder="Explica el motivo del rechazo..." rows={3} className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-red-500 focus:border-red-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleReject} disabled={rejecting} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60">{rejecting ? "Rechazando..." : "Confirmar rechazo"}</button>
                <button onClick={() => setRejectTarget(null)} className="px-6 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
