"use client";

import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminTutorials, createTutorial, updateTutorial, deleteTutorial, Tutorial } from "@/lib/api";
import { Plus, Pencil, Trash2, EyeOff, Eye, Check, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminTutorialesPage() {
  const [items, setItems] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; item?: Tutorial }>({ open: false });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", video_url: "", image_url: "", status: "published" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setItems(await getAdminTutorials()); } catch { toast.error("Error al cargar"); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setForm({ title: "", description: "", video_url: "", image_url: "", status: "published" });
    setModal({ open: true });
  }

  function openEdit(t: Tutorial) {
    setForm({ title: t.title, description: t.description || "", video_url: t.video_url || "", image_url: t.image_url || "", status: t.status });
    setModal({ open: true, item: t });
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error("El título es obligatorio"); return; }
    setSaving(true);
    try {
      if (modal.item) { await updateTutorial(modal.item.id, form); toast.success("Tutorial actualizado"); }
      else { await createTutorial(form); toast.success("Tutorial creado"); }
      setModal({ open: false }); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este tutorial?")) return;
    try { await deleteTutorial(id); toast.success("Tutorial eliminado"); load(); }
    catch { toast.error("Error"); }
  }

  async function handleToggleStatus(t: Tutorial) {
    const s = t.status === "published" ? "draft" : "published";
    try { await updateTutorial(t.id, { status: s }); load(); } catch { toast.error("Error"); }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("lotifyx_access");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/uploads/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      setForm(f => ({ ...f, image_url: data.url }));
    } catch { toast.error("Error al subir imagen"); }
    finally { setUploadingImg(false); }
  }

  const statusColor: Record<string, string> = { published: "bg-green-50 text-green-700", draft: "bg-gray-100 text-gray-600" };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tutoriales</h1>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-4 py-2 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm">
            <Plus className="h-4 w-4" /> Nuevo tutorial
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No hay tutoriales aún</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Título</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Video</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3"><p className="font-semibold text-gray-900 text-sm truncate max-w-[300px]">{t.title}</p></td>
                    <td className="px-3 py-3 text-center hidden sm:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[t.status] || "bg-gray-100 text-gray-600"}`}>
                        {t.status === "published" ? "Publicado" : "Borrador"}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-sm text-gray-400">{t.video_url ? "Sí" : "—"}</td>
                    <td className="px-5 py-3 hidden lg:table-cell text-sm text-gray-400">{new Date(t.created_at).toLocaleDateString("es-PE")}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleToggleStatus(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title={t.status === "published" ? "Ocultar" : "Publicar"}>
                          {t.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
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
              <h2 className="font-bold text-gray-900 text-base">{modal.item ? "Editar tutorial" : "Nuevo tutorial"}</h2>
              <button onClick={() => setModal({ open: false })} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Título *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Título del tutorial"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500">
                    <option value="published">Publicado</option>
                    <option value="draft">Borrador</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Imagen</label>
                  <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    {uploadingImg ? "Subiendo..." : "Subir imagen"}
                  </label>
                </div>
              </div>
              {form.image_url && (
                <img src={form.image_url.startsWith("http") ? form.image_url : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${form.image_url}`} alt="" className="h-32 w-full object-cover rounded-lg border" />
              )}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">URL del video <span className="text-gray-400 font-normal">(YouTube, Vimeo, etc.)</span></label>
                <input type="text" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
                {form.video_url && (
                  <div className="mt-2 aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <iframe src={form.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} className="w-full h-full" allowFullScreen />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción del tutorial..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setModal({ open: false })} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm disabled:opacity-60">
                {saving ? "Guardando..." : <><Check className="h-4 w-4" /> {modal.item ? "Actualizar" : "Crear"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
