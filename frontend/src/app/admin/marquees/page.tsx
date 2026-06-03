"use client";

import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getMarquees, createMarquee, deleteMarquee, updateMarquee, Marquee } from "@/lib/api";
import { Plus, Trash2, Upload, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function MarqueesPage() {
  const [items, setItems] = useState<Marquee[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setItems(await getMarquees()); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!name.trim()) { toast.error("Ingresa un nombre"); return; }
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Selecciona una imagen"); return; }
    setUploading(true);
    try {
      await createMarquee(name.trim(), file);
      toast.success("Logo creado");
      setName(""); if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este logo?")) return;
    try { await deleteMarquee(id); toast.success("Logo eliminado"); setItems(p => p.filter(i => i.id !== id)); }
    catch (e: any) { toast.error(e.message); }
  }

  function startEdit(item: Marquee) { setEditingId(item.id); setEditName(item.name); setEditFile(null); }
  function cancelEdit() { setEditingId(null); setEditName(""); setEditFile(null); }

  async function handleUpdate(id: string) {
    if (!editName.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      await updateMarquee(id, editName.trim(), editFile || undefined);
      toast.success("Logo actualizado");
      cancelEdit();
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Logos</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona los logos del marquee</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Nuevo logo</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del logo"
              className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
            <div className="flex gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                <Upload className="h-4 w-4" /> Seleccionar imagen
                <input ref={fileRef} type="file" accept="image/*" className="hidden" />
              </label>
              <button onClick={handleCreate} disabled={uploading}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm disabled:opacity-60">
                <Plus className="h-4 w-4" /> {uploading ? "Subiendo..." : "Crear"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Logos ({items.length})</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay logos creados</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <img src={item.image_url.startsWith("http") ? item.image_url : `${API_URL}${item.image_url}`} alt={item.name}
                    className="w-16 h-10 object-contain rounded border border-gray-100 flex-shrink-0 bg-gray-50" />
                  {editingId === item.id ? (
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
                      <label className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${editFile ? "border-primary-300 bg-primary-50 text-primary-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                        <Upload className="h-3.5 w-3.5" /> {editFile ? editFile.name.slice(0, 12) + "..." : "Imagen"}
                        <input type="file" accept="image/*" className="hidden" onChange={e => setEditFile(e.target.files?.[0] || null)} />
                      </label>
                      <button onClick={() => handleUpdate(item.id)} disabled={saving} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
                      <button onClick={cancelEdit} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(item.created_at).toLocaleDateString("es-PE")}{item.is_active ? " · Activo" : " · Inactivo"}</p>
                      </div>
                      <button onClick={() => startEdit(item)} className="p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
