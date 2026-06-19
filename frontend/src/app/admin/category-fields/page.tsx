"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getCategoryFieldsAdmin, createCategoryField, updateCategoryField, deleteCategoryField, getCategories, CategoryField, Category, isAuthenticated } from "@/lib/api";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";

const FIELD_TYPES = ["text", "textarea", "number", "image", "select"];

function flattenCats(cats: Category[]): Category[] {
  const flat: Category[] = [];
  function walk(c: Category) { flat.push(c); c.children?.forEach(walk); }
  cats.forEach(walk);
  return flat;
}

export default function CategoryFieldsAdminPage() {
  const [items, setItems] = useState<CategoryField[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [form, setForm] = useState({ category_id: "", name: "", label: "", type: "text", required: false, options: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ category_id: "", name: "", label: "", type: "text", required: false, options: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!isAuthenticated()) return;
    setLoading(true);
    try {
      const [fields, cats] = await Promise.all([getCategoryFieldsAdmin(), getCategories()]);
      setItems(fields);
      const flat = flattenCats(cats);
      setCategories(flat);
      if (flat.length > 0 && !activeTab) setActiveTab(flat[0].id);
    }
    catch { toast.error("Error"); }
    finally { setLoading(false); }
  }

  const filtered = items.filter(f => f.category_id === activeTab);

  async function handleCreate() {
    if (!form.name || !form.category_id) return;
    setSaving(true);
    try {
      const dto: any = { category_id: form.category_id, name: form.name, label: form.label, type: form.type, required: form.required };
      if (form.type === "select" && form.options) dto.options = form.options.split(",").map(s => s.trim()).filter(Boolean);
      await createCategoryField(dto);
      toast.success("Creado");
      setForm({ category_id: activeTab, name: "", label: "", type: "text", required: false, options: "" });
      load();
    }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    try {
      const dto: any = { ...editForm };
      if (editForm.type === "select" && editForm.options) dto.options = editForm.options.split(",").map(s => s.trim()).filter(Boolean);
      else dto.options = null;
      await updateCategoryField(id, dto);
      toast.success("Actualizado");
      setEditingId(null);
      load();
    }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar?")) return;
    try { await deleteCategoryField(id); toast.success("Eliminado"); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Campos de Categorías</h1>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Nuevo Campo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre (ej. titulo)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
            <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
              placeholder="Etiqueta (ej. Título)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white">
              {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-4 items-center">
            {form.type === "select" && (
              <input value={form.options} onChange={e => setForm({ ...form, options: e.target.value })}
                placeholder="Opciones separadas por coma" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
            )}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.required} onChange={e => setForm({ ...form, required: e.target.checked })}
                className="rounded border-gray-300 text-primary-600" />
              <span className="text-xs text-gray-600">Requerido</span>
            </label>
            <button onClick={handleCreate} disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
              <Plus className="h-4 w-4" /> Crear
            </button>
          </div>
        </div>

        {/* Tabs */}
        {categories.length > 0 && (
          <div className="flex gap-1 mb-6 overflow-x-auto">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => { setActiveTab(cat.id); setForm({ ...form, category_id: cat.id }); }}
                className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === cat.id
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}>
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              {categories.find(c => c.id === activeTab)?.name || "Campos"} ({filtered.length})
            </h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay campos para esta categoría</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(f => (
                <div key={f.id} className="px-6 py-4 hover:bg-gray-50">
                  {editingId === f.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2">
                        <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          className="rounded border border-gray-300 px-3 py-1.5 text-sm" />
                        <input value={editForm.label} onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                          className="rounded border border-gray-300 px-3 py-1.5 text-sm" />
                        <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                          className="rounded border border-gray-300 px-3 py-1.5 text-sm bg-white">
                          {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-4">
                        {editForm.type === "select" && (
                          <input value={editForm.options} onChange={e => setEditForm({ ...editForm, options: e.target.value })}
                            placeholder="Opciones separadas por coma" className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm" />
                        )}
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={editForm.required} onChange={e => setEditForm({ ...editForm, required: e.target.checked })}
                            className="rounded border-gray-300 text-primary-600" />
                          <span className="text-xs text-gray-600">Req.</span>
                        </label>
                        <button onClick={() => handleUpdate(f.id)} className="p-1 text-green-600"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">{f.type}</span>
                          <span className="text-sm font-medium text-gray-900">{f.label}</span>
                          <span className="text-xs text-gray-400">({f.name})</span>
                          {f.required && <span className="text-xs text-red-500">*</span>}
                          {f.options && f.options.length > 0 && (
                            <span className="text-xs text-gray-400 truncate max-w-[200px]">— {f.options.join(", ")}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => { setEditingId(f.id); setEditForm({ category_id: f.category_id, name: f.name, label: f.label, type: f.type, required: f.required, options: f.options?.join(", ") || "" }); }}
                          className="p-1.5 rounded text-gray-400 hover:text-primary-500 hover:bg-primary-50"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
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
