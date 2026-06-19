"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getFaqCategoriesAdmin, createFaqCategory, updateFaqCategory, deleteFaqCategory, FaqCategory, isAuthenticated } from "@/lib/api";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";

export default function FaqCategoriesAdminPage() {
  const [items, setItems] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!isAuthenticated()) return;
    setLoading(true);
    try { setItems(await getFaqCategoriesAdmin()); }
    catch { toast.error("Error"); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.name) return;
    setSaving(true);
    try { await createFaqCategory(form); toast.success("Creada"); setForm({ name: "", description: "" }); load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    try { await updateFaqCategory(id, editForm); toast.success("Actualizada"); setEditingId(null); load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar?")) return;
    try { await deleteFaqCategory(id); toast.success("Eliminada"); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Categorías FAQ</h1>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Nueva Categoría</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción (opcional)" className="sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
          </div>
          <button onClick={handleCreate} disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
            <Plus className="h-4 w-4" /> Crear Categoría
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Categorías ({items.length})</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay categorías</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map(c => (
                <div key={c.id} className="px-6 py-4 hover:bg-gray-50">
                  {editingId === c.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Nombre" className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                        <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Descripción" className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                            className="rounded border-gray-300 text-primary-600" />
                          <span className="text-xs text-gray-600">Activo</span>
                        </label>
                        <button onClick={() => handleUpdate(c.id)} className="p-1 text-green-600"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                        <div className="flex gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">{c.slug}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${c.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {c.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => { setEditingId(c.id); setEditForm({ name: c.name, description: c.description || "", is_active: c.is_active }); }}
                          className="p-1.5 rounded text-gray-400 hover:text-primary-500 hover:bg-primary-50"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
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
