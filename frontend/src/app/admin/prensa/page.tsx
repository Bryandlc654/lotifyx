"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminPressArticles, createPressArticle, updatePressArticle, deletePressArticle, PressArticle } from "@/lib/api";
import { Plus, Pencil, Trash2, EyeOff, Eye, Check, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AdminPrensaPage() {
  const [items, setItems] = useState<PressArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; item?: PressArticle }>({ open: false });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", excerpt: "", source: "", link: "", image_url: "", status: "published" });

  useEffect(() => { load(); }, []);

  async function load() {
    try { setItems(await getAdminPressArticles()); } catch { toast.error("Error"); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setForm({ title: "", excerpt: "", source: "", link: "", image_url: "", status: "published" });
    setModal({ open: true });
  }

  function openEdit(a: PressArticle) {
    setForm({ title: a.title, excerpt: a.excerpt || "", source: a.source, link: a.link, image_url: a.image_url || "", status: a.status });
    setModal({ open: true, item: a });
  }

  async function handleSave() {
    if (!form.title.trim() || !form.source.trim() || !form.link.trim()) { toast.error("Título, fuente y enlace obligatorios"); return; }
    setSaving(true);
    try {
      if (modal.item) { await updatePressArticle(modal.item.id, form); toast.success("Actualizada"); }
      else { await createPressArticle(form); toast.success("Creada"); }
      setModal({ open: false }); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar?")) return;
    try { await deletePressArticle(id); toast.success("Eliminada"); load(); } catch { toast.error("Error"); }
  }

  async function handleToggleStatus(a: PressArticle) {
    const s = a.status === "published" ? "draft" : "published";
    try { await updatePressArticle(a.id, { status: s }); load(); } catch { toast.error("Error"); }
  }

  const sc: Record<string, string> = { published: "bg-green-50 text-green-700", draft: "bg-gray-100 text-gray-600" };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Prensa</h1>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-4 py-2 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm">
            <Plus className="h-4 w-4" /> Nueva nota
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No hay notas de prensa</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Título</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Fuente</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Estado</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3"><p className="font-semibold text-gray-900 text-sm truncate max-w-[300px]">{a.title}</p></td>
                    <td className="px-5 py-3 hidden sm:table-cell"><span className="text-sm text-gray-500">{a.source}</span></td>
                    <td className="px-3 py-3 text-center hidden sm:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${sc[a.status] || "bg-gray-100 text-gray-600"}`}>
                        {a.status === "published" ? "Publicado" : "Borrador"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleToggleStatus(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          {a.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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

      {modal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 pt-12 overflow-y-auto" onClick={() => setModal({ open: false })}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-base">{modal.item ? "Editar nota" : "Nueva nota de prensa"}</h2>
              <button onClick={() => setModal({ open: false })} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Título *</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título" className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Fuente *</label>
                  <input type="text" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Ej: El Comercio" className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Enlace *</label>
                <input type="url" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Imagen (URL)</label>
                  <input type="text" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="URL de imagen" className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white">
                    <option value="published">Publicado</option>
                    <option value="draft">Borrador</option>
                  </select>
                </div>
              </div>
              {form.image_url && <img src={form.image_url.startsWith("http") ? form.image_url : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${form.image_url}`} alt="" className="h-32 w-full object-cover rounded-lg border" />}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Extracto</label>
                <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={3} placeholder="Resumen de la nota..." className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setModal({ open: false })} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm disabled:opacity-60">
                {saving ? "Guardando..." : <><Check className="h-4 w-4" /> {modal.item ? "Actualizar" : "Crear"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
