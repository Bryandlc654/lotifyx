"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminNewsletter, deleteNewsletterSubscriber, exportNewsletterCsv } from "@/lib/api";
import { Mail, Calendar, CheckCircle, XCircle, Loader2, Download, Trash2 } from "lucide-react";

export default function AdminNewsletterPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const activeCount = subs.filter(s => s.is_active).length;

  useEffect(() => {
    getAdminNewsletter().then(setSubs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, email: string) {
    if (!confirm(`¿Eliminar a "${email}" de la lista?`)) return;
    try { await deleteNewsletterSubscriber(id); setSubs(prev => prev.filter(s => s.id !== id)); } catch {}
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
            <p className="text-sm text-gray-500 mt-1">{subs.length} suscriptores ({activeCount} activos)</p>
          </div>
          <button onClick={() => exportNewsletterCsv().catch(() => {})}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
        ) : subs.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay suscriptores aún</p>
            <p className="text-xs text-gray-400 mt-1">Los usuarios registrados se suscriben automáticamente</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nombre</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Fecha</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subs.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3"><span className="text-sm text-gray-900">{s.name || "—"}</span></td>
                    <td className="px-5 py-3"><span className="text-sm text-gray-600">{s.email}</span></td>
                    <td className="px-3 py-3 text-center hidden sm:table-cell">
                      {s.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700">
                          <CheckCircle className="h-3 w-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600">
                          <XCircle className="h-3 w-3" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-sm text-gray-400">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(s.created_at).toLocaleDateString("es-PE")}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(s.id, s.email)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
