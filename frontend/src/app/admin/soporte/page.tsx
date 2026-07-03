"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminSupportTickets, updateSupportTicket, deleteSupportTicket, SupportTicket } from "@/lib/api";
import { Search, MessageSquare, CheckCircle, XCircle, AlertCircle, Send, Loader2, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = { open: "Abierto", in_progress: "En progreso", resolved: "Resuelto", closed: "Cerrado" };
const statusColors: Record<string, string> = { open: "bg-yellow-50 text-yellow-700", in_progress: "bg-blue-50 text-blue-700", resolved: "bg-green-50 text-green-700", closed: "bg-gray-100 text-gray-600" };

export default function AdminSoportePage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setTickets(await getAdminSupportTickets()); } catch { toast.error("Error"); }
    finally { setLoading(false); }
  }

  async function handleRespond(id: string) {
    if (!responseText.trim()) return;
    setSaving(true);
    try {
      await updateSupportTicket(id, { status: "resolved", response: responseText.trim() });
      toast.success("Respuesta enviada");
      setDetail(null); setResponseText(""); load();
    } catch { toast.error("Error"); }
    finally { setSaving(false); }
  }

  async function handleStatus(id: string, status: string) {
    try { await updateSupportTicket(id, { status }); load(); } catch { toast.error("Error"); }
  }

  async function handleDelete(id: string, num: string) {
    if (!confirm(`¿Eliminar ticket ${num}?`)) return;
    try { await deleteSupportTicket(id); toast.success("Ticket eliminado"); load(); } catch { toast.error("Error"); }
  }

  const filtered = tickets.filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !t.ticket_number.includes(search) && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.email.toLowerCase().includes(search.toLowerCase()) && !t.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Soporte <span className="text-sm font-normal text-gray-400">({filtered.length} tickets)</span></h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tickets..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200">
            <option value="all">Todos los estados</option>
            <option value="open">Abierto</option>
            <option value="in_progress">En progreso</option>
            <option value="resolved">Resuelto</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No hay tickets que coincidan</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Ticket</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Cliente</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Asunto</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3"><span className="text-xs font-mono font-bold text-gray-900">{t.ticket_number}</span></td>
                    <td className="px-5 py-3 hidden sm:table-cell"><div><p className="text-sm font-medium text-gray-900">{t.name}</p><p className="text-xs text-gray-400">{t.email}</p></div></td>
                    <td className="px-5 py-3 hidden md:table-cell"><span className="text-sm text-gray-600 truncate max-w-[200px] block">{t.subject}</span></td>
                    <td className="px-3 py-3 text-center">
                      <select value={t.status} onChange={e => handleStatus(t.id, e.target.value)}
                        className={`text-[10px] font-medium rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-1 focus:ring-purple-300 ${statusColors[t.status] || "bg-gray-100 text-gray-600"}`}>
                        <option value="open">Abierto</option>
                        <option value="in_progress">En progreso</option>
                        <option value="resolved">Resuelto</option>
                        <option value="closed">Cerrado</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-sm text-gray-400">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(t.created_at).toLocaleDateString("es-PE")}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => { setDetail(t); setResponseText(t.response || ""); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ver/Responder">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id, t.ticket_number)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-base">{detail.ticket_number}</h2>
                <button onClick={() => setDetail(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><XCircle className="h-5 w-5" /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div><span className="text-gray-400 text-xs block">Cliente</span><p className="font-medium">{detail.name} — {detail.email}</p></div>
                <div><span className="text-gray-400 text-xs block">Asunto</span><p className="font-medium">{detail.subject}</p></div>
                <div><span className="text-gray-400 text-xs block">Descripción</span><p className="text-gray-700">{detail.description}</p></div>
                {detail.images?.length > 0 && <div><span className="text-gray-400 text-xs block">Imágenes</span><div className="flex gap-2 mt-1">{detail.images.map((u, i) => <img key={i} src={u.startsWith("http") ? u : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${u}`} alt="" className="w-16 h-16 object-cover rounded-lg border" />)}</div></div>}
                {detail.files?.length > 0 && <div><span className="text-gray-400 text-xs block">Archivos</span><p className="text-xs text-purple-600">{detail.files.length} archivo(s)</p></div>}
                <div><span className="text-gray-400 text-xs block">Fecha</span><p className="text-gray-500">{new Date(detail.created_at).toLocaleString("es-PE")}</p></div>
                {detail.response && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <span className="text-xs font-semibold text-purple-700 block mb-1">Respuesta enviada</span>
                    <p className="text-sm text-gray-700">{detail.response}</p>
                  </div>
                )}
                {detail.status !== "resolved" && detail.status !== "closed" && (
                  <div className="pt-3 border-t border-gray-100">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Responder ticket</label>
                    <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={3} placeholder="Escribe tu respuesta..." className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none" />
                    <button onClick={() => handleRespond(detail.id)} disabled={saving} className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-4 py-2 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all disabled:opacity-60">
                      {saving ? "Enviando..." : <><Send className="h-4 w-4" /> Enviar respuesta</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
