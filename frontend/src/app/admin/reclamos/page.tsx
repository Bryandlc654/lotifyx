"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminClaims, updateClaimStatus } from "@/lib/api";
import { Eye, Search, User, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Claim {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  description: string;
  solution: string;
  amount: number;
  status: string;
  created_at: string;
  total_amount: number;
  order_date: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  reviewed: "Revisado",
  resolved: "Resuelto",
  rejected: "Rechazado",
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  reviewed: "bg-blue-50 text-blue-700",
  resolved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export default function AdminReclamosPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Claim | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setClaims(await getAdminClaims()); }
    catch { toast.error("Error al cargar reclamos"); }
    finally { setLoading(false); }
  }

  async function handleStatus(id: string, newStatus: string) {
    try {
      await updateClaimStatus(id, newStatus);
      toast.success("Estado actualizado");
      setClaims(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch { toast.error("Error al actualizar"); }
  }

  const filtered = claims.filter(c =>
    !search || c.reason.toLowerCase().includes(search.toLowerCase()) || (c.user_email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reclamos</h1>
          <span className="text-sm text-gray-400">{filtered.length} reclamo{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="relative mb-6 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar reclamo..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No hay reclamos</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Usuario</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Motivo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Solución</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-700">{c.user_first_name ? `${c.user_first_name} ${c.user_last_name}` : c.user_email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-700">{c.reason}</span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-500">{c.solution}</span>
                      {c.amount > 0 && <span className="text-xs text-gray-400 ml-1">S/ {Number(c.amount).toFixed(2)}</span>}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[c.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabels[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setDetail(c)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        {c.status === "pending" && (
                          <>
                            <button onClick={() => handleStatus(c.id, "reviewed")}
                              className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-100">
                              Revisar
                            </button>
                            <button onClick={() => handleStatus(c.id, "rejected")}
                              className="text-[10px] font-semibold bg-red-50 text-red-700 px-2 py-1 rounded-lg hover:bg-red-100">
                              Rechazar
                            </button>
                          </>
                        )}
                        {c.status === "reviewed" && (
                          <button onClick={() => handleStatus(c.id, "resolved")}
                            className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-1 rounded-lg hover:bg-green-100">
                            Resolver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Detalle del Reclamo</h2>
              <button onClick={() => setDetail(null)} className="p-1 rounded-lg hover:bg-gray-100"><XCircle className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4 text-sm">
              <div><span className="text-gray-500 block text-xs">Usuario</span><span className="font-medium">{detail.user_first_name ? `${detail.user_first_name} ${detail.user_last_name}` : detail.user_email}</span></div>
              <div><span className="text-gray-500 block text-xs">Motivo</span><span className="font-medium">{detail.reason}</span></div>
              <div><span className="text-gray-500 block text-xs">Solución solicitada</span><span className="font-medium">{detail.solution}{detail.amount > 0 ? ` — S/ ${Number(detail.amount).toFixed(2)}` : ""}</span></div>
              <div><span className="text-gray-500 block text-xs">Descripción</span><p className="text-gray-700 mt-1 bg-gray-50 rounded-lg p-3">{detail.description}</p></div>
              <div className="flex justify-between"><span className="text-gray-500">Pedido</span><span className="font-medium font-mono text-xs">{detail.order_id?.slice(0, 8)}...</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Monto pedido</span><span className="font-medium">S/ {Number(detail.total_amount).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Estado</span><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[detail.status]}`}>{statusLabels[detail.status]}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fecha</span><span className="font-medium">{new Date(detail.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                {detail.status === "pending" && (
                  <>
                    <button onClick={() => { handleStatus(detail.id, "reviewed"); setDetail(null); }}
                      className="flex-1 text-white font-bold py-2 rounded-lg bg-blue-500 hover:bg-blue-600">Revisar</button>
                    <button onClick={() => { handleStatus(detail.id, "rejected"); setDetail(null); }}
                      className="flex-1 text-white font-bold py-2 rounded-lg bg-red-500 hover:bg-red-600">Rechazar</button>
                  </>
                )}
                {detail.status === "reviewed" && (
                  <button onClick={() => { handleStatus(detail.id, "resolved"); setDetail(null); }}
                    className="flex-1 text-white font-bold py-2 rounded-lg bg-green-500 hover:bg-green-600">Resolver</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
