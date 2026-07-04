"use client";

import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  getSecondaryBanners, createSecondaryBanner, updateSecondaryBanner, deleteSecondaryBanner, SecondaryBanner,
} from "@/lib/api";
import { Plus, Trash2, Pencil, X, Check, Upload } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SecondaryBannersPage() {
  const [tab, setTab] = useState("promo1");
  const [items, setItems] = useState<SecondaryBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create
  const [form, setForm] = useState({ title: "", subtitle: "", link_url: "", button_text: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", subtitle: "", link_url: "", button_text: "", is_active: true });
  const [editFile, setEditFile] = useState<File | null>(null);

  useEffect(() => { load(); }, [tab]);

  async function load() {
    setLoading(true);
    try { const all = await getSecondaryBanners(); setItems(all.filter(b => b.type === tab)); }
    catch (e: any) { toast.error("Error al cargar"); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.title) { toast.error("Título obligatorio"); return; }
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Selecciona una imagen"); return; }
    setSaving(true);
    try {
      await createSecondaryBanner({ title: form.title, subtitle: form.subtitle, type: tab, link_url: form.link_url, button_text: form.button_text }, file);
      toast.success(`Banner "${form.title}" creado correctamente`);
      setForm({ title: "", subtitle: "", link_url: "", button_text: "" });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    try {
      await updateSecondaryBanner(id, { ...editForm }, editFile || undefined);
      toast.success("Actualizado");
      setEditingId(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  const [deleteTarget, setDeleteTarget] = useState<SecondaryBanner | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await deleteSecondaryBanner(deleteTarget.id); toast.success("Banner eliminado"); load(); setDeleteTarget(null); }
    catch (e: any) { toast.error(e.message); }
    finally { setDeleting(false); }
  }

  function startEdit(b: SecondaryBanner) {
    setEditingId(b.id);
    setEditForm({ title: b.title, subtitle: b.subtitle || "", link_url: b.link_url || "", button_text: b.button_text || "", is_active: b.is_active });
    setEditFile(null);
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Banners Secundarios</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {[
            { key: "promo1", label: "Banner Promo 1" },
            { key: "promo2", label: "Banner Promo 2" },
            { key: "promo3", label: "Banner Promo 3" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Create form */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Nuevo banner</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Título" className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
            <input type="text" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})}
              placeholder="Subtítulo (opcional)" className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input type="text" value={form.link_url} onChange={e => setForm({...form, link_url: e.target.value})}
              placeholder="URL del enlace (opcional)" className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
            <input type="text" value={form.button_text} onChange={e => setForm({...form, button_text: e.target.value})}
              placeholder="Texto del botón" className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
          </div>
          <div className="flex gap-3">
            <label className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${selectedFile ? "border-primary-300 bg-primary-50 text-primary-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
              <Upload className="h-4 w-4" /> {selectedFile ? selectedFile.name : "Seleccionar imagen"}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
            </label>
            <button onClick={handleCreate} disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
              <Plus className="h-4 w-4" /> Crear
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Banners ({items.length})</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay banners</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map(b => (
                <div key={b.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                  <img src={b.image_url.startsWith("http") ? b.image_url : `${API_URL}${b.image_url}`}
                    className="w-32 h-20 object-cover rounded-lg border border-gray-100 flex-shrink-0" />
                  {editingId === b.id ? (
                    <div className="flex-1 space-y-2">
                      <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})}
                        className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                      <input type="text" value={editForm.subtitle} onChange={e => setEditForm({...editForm, subtitle: e.target.value})}
                        placeholder="Subtítulo" className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                      <div className="flex gap-2">
                        <input type="text" value={editForm.link_url} onChange={e => setEditForm({...editForm, link_url: e.target.value})}
                          placeholder="URL" className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                        <input type="text" value={editForm.button_text} onChange={e => setEditForm({...editForm, button_text: e.target.value})}
                          placeholder="Texto botón" className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs cursor-pointer border rounded px-3 py-1.5">
                          <Upload className="h-3 w-3" /> {editFile ? editFile.name.slice(0,15) : "Nueva imagen"}
                          <input type="file" accept="image/*" className="hidden" onChange={e => setEditFile(e.target.files?.[0] || null)} />
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({...editForm, is_active: e.target.checked})}
                            className="rounded border-gray-300 text-primary-600" />
                          <span className="text-xs text-gray-600">Activo</span>
                        </label>
                        <button onClick={() => handleUpdate(b.id)} className="p-1 text-green-600"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{b.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{b.link_url || "Sin enlace"} · {b.button_text || "Sin botón"} {!b.is_active && "· Inactivo"}</p>
                      </div>
                      <button onClick={() => startEdit(b)} className="p-2 rounded text-gray-400 hover:text-primary-500 hover:bg-primary-50"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteTarget(b)} className="p-2 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar banner</h3>
            <p className="text-sm text-gray-500 mb-6">¿Estás seguro de eliminar <span className="font-semibold text-gray-700">{deleteTarget.title}</span>?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60">
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
