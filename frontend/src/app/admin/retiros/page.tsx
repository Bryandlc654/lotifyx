"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { authFetch } from "@/lib/api";
import { toast } from "sonner";
import { Check, X, Eye, Search, User, Mail, Banknote, Loader2 } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  completed: "Completado",
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  approved: "bg-blue-50 text-blue-700",
  rejected: "bg-red-50 text-red-700",
  completed: "bg-green-50 text-green-700",
};

export default function AdminRetirosPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => { load(); }, [page]);

  async function load() {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/admin/withdrawals?page=${page}&limit=20`);
      const data = await res.json();
      if (!res.ok) throw new Error();
      setWithdrawals(data.data);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch {
      toast.error("Error al cargar retiros");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      const res = await authFetch(`${API_URL}/admin/withdrawals/${id}/approve`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      toast.success("Retiro aprobado");
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: "approved" } : w));
    } catch {
      toast.error("Error al aprobar");
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      const res = await authFetch(`${API_URL}/admin/withdrawals/${rejectTarget.id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ motivo: rejectMotivo.trim() || "Rechazado por el administrador" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Retiro rechazado");
      setWithdrawals(prev => prev.map(w => w.id === rejectTarget.id ? { ...w, status: "rejected" } : w));
      setRejectTarget(null);
      setRejectMotivo("");
    } catch {
      toast.error("Error al rechazar");
    } finally {
      setRejecting(false);
    }
  }

  async function handleToggleDeposit(id: string) {
    try {
      const res = await authFetch(`${API_URL}/admin/withdrawals/${id}/toggle-deposit`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      toast.success("Estado de depósito actualizado");
      await load();
    } catch {
      toast.error("Error al actualizar depósito");
    }
  }

  const filtered = withdrawals.filter(w => {
    if (!search) return true;
    const q = search.toLowerCase();
    return w.id?.includes(q) || w.bank_name?.toLowerCase().includes(q) || w.account_number?.includes(q) || w.first_name?.toLowerCase().includes(q) || w.last_name?.toLowerCase().includes(q) || w.email?.toLowerCase().includes(q);
  });

  function formatPrice(n: number) {
    return "S/ " + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Retiros</h1>
          <span className="text-sm text-gray-400">{totalItems} solicitude{totalItems !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por ID, banco, cuenta..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No se encontraron solicitudes de retiro</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Vendedor</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Monto</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Banco</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Depósito</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(w => (
                    <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-xs text-gray-600">{new Date(w.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric" })}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-xs font-medium text-gray-700">{w.first_name} {w.last_name}</p>
                          <p className="text-[10px] text-gray-400">{w.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-gray-900">{formatPrice(w.amount)}</span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <div>
                          <p className="text-xs text-gray-700">{w.bank_name}</p>
                          <p className="text-[10px] text-gray-400">{w.account_number}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={"text-[10px] font-medium rounded-full px-2 py-1 " + (statusColor[w.status] || "bg-gray-100 text-gray-600")}>
                          {statusLabels[w.status] || w.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        {w.status === "approved" || w.status === "completed" ? (
                          <span className={`text-xs font-medium ${w.deposit_confirmed ? "text-green-600" : "text-orange-500"}`}>
                            {w.deposit_confirmed ? "Confirmado" : "Pendiente"}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex gap-1 justify-end items-center">
                          <button onClick={() => setDetail(w)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalles">
                            <Eye className="h-4 w-4" />
                          </button>
                          {w.status === "pending" && (
                            <>
                              <button onClick={() => handleApprove(w.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Aprobar">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => { setRejectTarget(w); setRejectMotivo(""); }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Rechazar">
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {(w.status === "approved" || w.status === "completed") && (
                            <button onClick={() => handleToggleDeposit(w.id)}
                              className={`p-1.5 rounded-lg transition-colors ${w.deposit_confirmed ? "text-orange-500 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`}
                              title={w.deposit_confirmed ? "Marcar depósito pendiente" : "Confirmar depósito"}>
                              <Banknote className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Detalle del Retiro</h2>
              <button onClick={() => setDetail(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Monto</span>
                <span className="font-bold">{formatPrice(detail.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <span className={"text-xs font-medium rounded-full px-2 py-0.5 " + (statusColor[detail.status] || "bg-gray-100")}>
                  {statusLabels[detail.status] || detail.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Depósito</span>
                <span className={`text-xs font-medium ${detail.deposit_confirmed ? "text-green-600" : "text-orange-500"}`}>
                  {detail.deposit_confirmed ? "Confirmado" : "Pendiente"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha solicitud</span>
                <span className="font-medium">{new Date(detail.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              {detail.processed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Procesado</span>
                  <span className="font-medium">{new Date(detail.processed_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100">
                <span className="text-gray-500 block mb-2">Vendedor</span>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-700"><User className="w-3 h-3 text-purple-500" />{detail.first_name} {detail.last_name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="w-3 h-3" />{detail.email}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <span className="text-gray-500 block mb-2">Cuenta bancaria</span>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="text-xs text-gray-700"><span className="font-semibold">Banco:</span> {detail.bank_name || "-"}</p>
                  <p className="text-xs text-gray-700"><span className="font-semibold">Cuenta:</span> {detail.account_number || "-"}</p>
                  <p className="text-xs text-gray-700"><span className="font-semibold">Titular:</span> {detail.account_holder || "-"}</p>
                </div>
              </div>

              {detail.notes && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-gray-500 block mb-1">Notas</span>
                  <p className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3">{detail.notes}</p>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                {detail.status === "pending" && (
                  <>
                    <button onClick={() => { handleApprove(detail.id); setDetail(null); }}
                      className="flex-1 text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90 bg-gradient-to-r from-purple-600 to-blue-500">
                      Aprobar
                    </button>
                    <button onClick={() => { setRejectTarget(detail); setDetail(null); }}
                      className="px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">
                      Rechazar
                    </button>
                  </>
                )}
                {(detail.status === "approved" || detail.status === "completed") && (
                  <button onClick={() => { handleToggleDeposit(detail.id); setDetail(null); }}
                    className={`flex-1 text-white font-bold py-3 rounded-xl transition-colors ${detail.deposit_confirmed ? "bg-orange-500 hover:bg-orange-600" : "bg-green-600 hover:bg-green-700"}`}>
                    {detail.deposit_confirmed ? "Marcar depósito pendiente" : "Confirmar depósito"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRejectTarget(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Rechazar Retiro</h2>
              <button onClick={() => setRejectTarget(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Monto solicitado: <span className="font-bold text-gray-800">{formatPrice(rejectTarget.amount)}</span></p>
              <div>
                <label className="text-xs font-bold text-gray-700">Motivo del rechazo</label>
                <textarea value={rejectMotivo} onChange={e => setRejectMotivo(e.target.value)} placeholder="Opcional..." rows={3} className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-red-500 focus:border-red-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleReject} disabled={rejecting} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60">
                  {rejecting ? "Rechazando..." : "Confirmar rechazo"}
                </button>
                <button onClick={() => setRejectTarget(null)} className="px-6 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
