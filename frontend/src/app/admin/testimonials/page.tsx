"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  reorderTestimonials, Testimonial,
} from "@/lib/api";
import { Plus, Trash2, Pencil, X, Check, Star, GripVertical } from "lucide-react";
import { toast } from "sonner";

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Create form
  const [form, setForm] = useState({ stars: 5, text: "", name: "", cargo: "" });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ stars: 5, text: "", name: "", cargo: "", is_active: true });

  useEffect(() => { load(); }, []);

  async function load() {
    try { setItems(await getTestimonials()); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.text.trim() || !form.name.trim()) { toast.error("Nombre y texto son obligatorios"); return; }
    setSaving(true);
    try {
      await createTestimonial({ ...form, stars: Number(form.stars) });
      toast.success("Testimonio creado");
      setForm({ stars: 5, text: "", name: "", cargo: "" });
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id: string) {
    if (!editForm.text.trim() || !editForm.name.trim()) { toast.error("Nombre y texto son obligatorios"); return; }
    setSaving(true);
    try {
      await updateTestimonial(id, { ...editForm, stars: Number(editForm.stars), is_active: editForm.is_active });
      toast.success("Testimonio actualizado");
      setEditingId(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este testimonio?")) return;
    try { await deleteTestimonial(id); toast.success("Eliminado"); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  function startEdit(item: Testimonial) {
    setEditingId(item.id);
    setEditForm({ stars: item.stars, text: item.text, name: item.name, cargo: item.cargo, is_active: item.is_active });
  }

  // ─── Drag & Drop ──────────────────────────
  async function handleDrop() {
    if (dragIdx === null) return;
    const ordered = items.map(i => i.id);
    try {
      await reorderTestimonials(ordered);
      toast.success("Orden actualizado");
    } catch (e: any) { toast.error("Error al reordenar"); load(); }
    setDragIdx(null);
  }

  function handleDragStart(idx: number) { setDragIdx(idx); }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const copy = [...items];
    const [moved] = copy.splice(dragIdx, 1);
    copy.splice(idx, 0, moved);
    setItems(copy);
    setDragIdx(idx);
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Testimonios</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona los testimonios del sitio</p>
        </div>

        {/* Create form */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Nuevo testimonio</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Nombre" className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
            <input type="text" value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})}
              placeholder="Cargo" className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
          </div>
          <textarea value={form.text} onChange={e => setForm({...form, text: e.target.value})} rows={3}
            placeholder="Texto del testimonio" className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 mb-4" />
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-gray-600">Estrellas:</label>
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setForm({...form, stars: n})}>
                <Star className={`h-5 w-5 ${n <= form.stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
              </button>
            ))}
          </div>
          <button onClick={handleCreate} disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Crear
          </button>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Testimonios ({items.length})</h2>
            <p className="text-xs text-gray-400">Arrastra para reordenar</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay testimonios</p>
          ) : (
            <div>
              {items.map((item, idx) => (
                <div key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDragEnd={handleDrop}
                  className={`flex items-start gap-3 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing ${dragIdx === idx ? "opacity-50" : ""}`}
                >
                  <GripVertical className="h-5 w-5 text-gray-300 flex-shrink-0 mt-1" />

                  <div className="flex-1 min-w-0">
                    {editingId === item.id ? (
                      /* Edit mode */
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                            className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                          <input type="text" value={editForm.cargo} onChange={e => setEditForm({...editForm, cargo: e.target.value})}
                            className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                        </div>
                        <textarea value={editForm.text} onChange={e => setEditForm({...editForm, text: e.target.value})} rows={2}
                          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(n => (
                              <button key={n} type="button" onClick={() => setEditForm({...editForm, stars: n})}>
                                <Star className={`h-4 w-4 ${n <= editForm.stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                              </button>
                            ))}
                          </div>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({...editForm, is_active: e.target.checked})}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                            <span className="text-xs text-gray-600">Activo</span>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdate(item.id)} disabled={saving} className="p-1 rounded text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 rounded text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <>
                        <div className="flex items-center gap-1 mb-1">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} className={`h-3.5 w-3.5 ${n <= item.stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{item.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.name} · {item.cargo} {item.is_active ? "" : "· Inactivo"}</p>
                      </>
                    )}
                  </div>

                  {!editingId && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(item)} className="p-1.5 rounded text-gray-400 hover:text-primary-500 hover:bg-primary-50"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
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
