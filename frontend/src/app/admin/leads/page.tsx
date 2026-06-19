"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getLeads, deleteLead, Lead, isAuthenticated } from "@/lib/api";
import { Trash2, Mail, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function LeadsAdminPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lead | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!isAuthenticated()) return;
    setLoading(true);
    try { setItems(await getLeads()); }
    catch { toast.error("Error al cargar leads"); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este lead?")) return;
    try { await deleteLead(id); toast.success("Lead eliminado"); load(); if (selected?.id === id) setSelected(null); }
    catch { toast.error("Error al eliminar"); }
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Leads</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* List */}
          <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Contactos ({items.length})
              </h2>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
            ) : items.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">No hay leads</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {items.map(l => (
                  <div key={l.id}
                    className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${selected?.id === l.id ? "bg-primary-50" : ""}`}
                    onClick={() => setSelected(l)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{l.first_name} {l.last_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
                          <Mail className="h-3 w-3 flex-shrink-0" /> {l.email}
                        </p>
                        {l.phone && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
                            <Phone className="h-3 w-3 flex-shrink-0" /> {l.phone}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(l.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleDelete(l.id); }}
                        className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="lg:w-96 bg-white rounded-xl border border-gray-100 p-6">
            {selected ? (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Detalle</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">Nombre</dt>
                    <dd className="text-sm text-gray-900 mt-1">{selected.first_name} {selected.last_name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">Email</dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      <a href={`mailto:${selected.email}`} className="text-primary-600 hover:underline">{selected.email}</a>
                    </dd>
                  </div>
                  {selected.phone && (
                    <div>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">Teléfono</dt>
                      <dd className="text-sm text-gray-900 mt-1">{selected.phone}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">Fecha</dt>
                    <dd className="text-sm text-gray-900 mt-1">{new Date(selected.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">Mensaje</dt>
                    <dd className="text-sm text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{selected.message}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">Selecciona un lead para ver su detalle</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
