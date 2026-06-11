"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getPlans, createPlan, updatePlan, deletePlan, Plan } from "@/lib/api";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";

export default function PlansPage() {
  const [items, setItems] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: "", description: "", price: 0, max_products: 1, max_featured: 0, duration_days: 30 });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", price: 0, max_products: 1, max_featured: 0, duration_days: 30, is_active: true });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setItems(await getPlans()); } catch (e: any) { toast.error("Error"); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.name) { toast.error("Nombre obligatorio"); return; }
    setSaving(true);
    try { await createPlan(form); toast.success("Creado"); setForm({ name: "", description: "", price: 0, max_products: 1, max_featured: 0, duration_days: 30 }); load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    try { await updatePlan(id, editForm); toast.success("Actualizado"); setEditingId(null); load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este plan?")) return;
    try { await deletePlan(id); toast.success("Eliminado"); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Planes</h1>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Nuevo plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nombre"
              className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
            <input type="number" value={form.price || ""} onChange={e => setForm({...form, price: Number(e.target.value)})} placeholder="Precio S/"
              className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
            <input type="number" value={form.duration_days || ""} onChange={e => setForm({...form, duration_days: Number(e.target.value)})} placeholder="Duración (días)"
              className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input type="number" value={form.max_products || ""} onChange={e => setForm({...form, max_products: Number(e.target.value)})} placeholder="Máx. productos"
              className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
            <input type="number" value={form.max_featured || ""} onChange={e => setForm({...form, max_featured: Number(e.target.value)})} placeholder="Máx. destacados"
              className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
          </div>
          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descripción"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 mb-4" />
          <button onClick={handleCreate} disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
            <Plus className="h-4 w-4" /> Crear plan
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Planes ({items.length})</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay planes</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map(p => (
                <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                  {editingId === p.id ? (
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                      <input type="number" value={editForm.price || ""} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})}
                        className="rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                      <input type="number" value={editForm.max_products || ""} onChange={e => setEditForm({...editForm, max_products: Number(e.target.value)})}
                        className="rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                      <input type="number" value={editForm.duration_days || ""} onChange={e => setEditForm({...editForm, duration_days: Number(e.target.value)})}
                        className="rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({...editForm, is_active: e.target.checked})}
                          className="rounded border-gray-300 text-primary-600" />
                        <span className="text-xs text-gray-600">Activo</span>
                      </label>
                      <button onClick={() => handleUpdate(p.id)} className="p-1 text-green-600"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400">S/ {p.price} / {p.duration_days} días</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">{p.max_products} producto{p.max_products !== 1 ? "s" : ""}</p>
                          {p.max_featured > 0 && <p className="text-xs text-gray-400">+{p.max_featured} destacado{p.max_featured !== 1 ? "s" : ""}</p>}
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs text-gray-500 line-clamp-2">{p.description || "—"}</p>
                        </div>
                        <div className="hidden sm:block">
                          {!p.is_active && <p className="text-xs text-red-500">Inactivo</p>}
                        </div>
                      </div>
                      <button onClick={() => { setEditingId(p.id); setEditForm({ name: p.name, description: p.description || "", price: p.price, max_products: p.max_products, max_featured: p.max_featured, duration_days: p.duration_days, is_active: p.is_active }); }}
                        className="p-2 rounded text-gray-400 hover:text-primary-500 hover:bg-primary-50"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
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
