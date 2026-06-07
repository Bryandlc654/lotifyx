"use client";

import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getBackingLogos, createBackingLogo, updateBackingLogo, deleteBackingLogo, BackingLogo } from "@/lib/api";
import { Plus, Trash2, Pencil, X, Check, Upload } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function BackingPage() {
  const [items, setItems] = useState<BackingLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editFile, setEditFile] = useState<File | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setItems(await getBackingLogos()); } catch (e: any) { toast.error("Error"); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!name.trim()) { toast.error("Nombre obligatorio"); return; }
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Selecciona imagen"); return; }
    setSaving(true);
    try { await createBackingLogo(name.trim(), file); toast.success("Creado"); setName(""); if (fileRef.current) fileRef.current.value = ""; load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    try { await updateBackingLogo(id, { name: editName, is_active: editActive }, editFile || undefined); toast.success("Actualizado"); setEditingId(null); load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar?")) return;
    try { await deleteBackingLogo(id); toast.success("Eliminado"); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Con el respaldo de</h1>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Nuevo logo</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre"
              className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
            <div className="flex gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
                <Upload className="h-4 w-4" /> Imagen
                <input ref={fileRef} type="file" accept="image/*" className="hidden" />
              </label>
              <button onClick={handleCreate} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
                <Plus className="h-4 w-4" /> Crear
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
            <p className="text-center text-gray-400 py-12 text-sm">No hay logos</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map(b => (
                <div key={b.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                  <img src={b.image_url.startsWith("http") ? b.image_url : `${API_URL}${b.image_url}`}
                    className="w-24 h-12 object-contain rounded border border-gray-100 bg-gray-50 flex-shrink-0" />
                  {editingId === b.id ? (
                    <div className="flex-1 flex items-center gap-3">
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                      <label className="flex items-center gap-2 text-xs border rounded px-3 py-1.5 cursor-pointer">
                        <Upload className="h-3 w-3" /> Imagen
                        <input type="file" accept="image/*" className="hidden" onChange={e => setEditFile(e.target.files?.[0] || null)} />
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)}
                          className="rounded border-gray-300 text-primary-600" />
                        <span className="text-xs text-gray-600">Activo</span>
                      </label>
                      <button onClick={() => handleUpdate(b.id)} className="p-1 text-green-600"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{b.name}</p>
                        <p className="text-xs text-gray-400">{b.is_active ? "Activo" : "Inactivo"}</p>
                      </div>
                      <button onClick={() => { setEditingId(b.id); setEditName(b.name); setEditActive(b.is_active); setEditFile(null); }}
                        className="p-2 rounded text-gray-400 hover:text-primary-500 hover:bg-primary-50"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(b.id)} className="p-2 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
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
