"use client";

import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  getCategories, createCategory, updateCategory, deleteCategory, Category,
} from "@/lib/api";
import { Plus, Pencil, Trash2, X, ChevronRight, Upload } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function CategoriesPage() {
  const [tree, setTree] = useState<Category[]>([]);
  const [allFlat, setAllFlat] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const [modal, setModal] = useState<{ open: boolean; category?: Category }>({ open: false });
  const [form, setForm] = useState({ name: "", slug: "", iconFile: null as File | null, parent_id: "", status: "active" });
  const [previewIcon, setPreviewIcon] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getCategories();
      setTree(data);
      const flat: Category[] = [];
      const flatten = (items: Category[]) => {
        for (const item of items) {
          flat.push(item);
          if (item.children?.length) flatten(item.children);
        }
      };
      flatten(data);
      setAllFlat(flat);
    } catch (e: any) { toast.error("Error al cargar"); }
    finally { setLoading(false); }
  }

  function openCreate(parentId?: string) {
    setForm({ name: "", slug: "", iconFile: null, parent_id: parentId || "", status: "active" });
    setPreviewIcon("");
    setModal({ open: true });
  }

  function openEdit(cat: Category) {
    setForm({ name: cat.name, slug: cat.slug, iconFile: null, parent_id: cat.parent_id || "", status: cat.status });
    setPreviewIcon(cat.icon || "");
    setModal({ open: true, category: cat });
  }

  async function handleSave() {
    if (!form.name || !form.slug) { toast.error("Nombre y slug obligatorios"); return; }
    setSaving(true);
    try {
      if (modal.category) {
        await updateCategory(modal.category.id, {
          name: form.name, slug: form.slug,
          icon: form.iconFile || undefined,
          parent_id: form.parent_id || undefined,
          status: form.status,
        });
        toast.success("Categoría actualizada");
      } else {
        await createCategory({
          name: form.name, slug: form.slug,
          icon: form.iconFile || undefined,
          parent_id: form.parent_id || undefined,
        });
        toast.success("Categoría creada");
      }
      setModal({ open: false });
      setExpanded(new Set());
      load();
    } catch (e: any) { toast.error(e.message || "Error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta categoría? Las subcategorías quedarán sin padre.")) return;
    try { await deleteCategory(id); toast.success("Eliminada"); load(); }
    catch (e: any) { toast.error("Error al eliminar"); }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function renderTree(items: Category[], depth: number = 0) {
    return items.map(cat => (
      <div key={cat.id}>
        <div className={`flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 ${depth > 0 ? "bg-gray-50/50" : ""}`}
          style={{ paddingLeft: `${16 + depth * 24}px` }}>
          {cat.children && cat.children.length > 0 ? (
            <button onClick={() => toggleExpand(cat.id)} className="p-0.5 rounded text-gray-400 hover:text-gray-600">
              <ChevronRight className={`h-4 w-4 transition-transform ${expanded.has(cat.id) ? "rotate-90" : ""}`} />
            </button>
          ) : <span className="w-5" />}

          {cat.icon ? (
            <img src={cat.icon.startsWith("http") ? cat.icon : `${API_URL}${cat.icon}`}
              className="w-6 h-6 object-contain flex-shrink-0" />
          ) : (
            <div className="w-6 h-6 rounded bg-gray-100 flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{cat.name}</p>
            <p className="text-xs text-gray-400 truncate">/{cat.slug}</p>
          </div>

          <span className={`hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-medium ${
            cat.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>{cat.status}</span>

          <button onClick={() => openEdit(cat)} className="p-1.5 rounded text-gray-400 hover:text-primary-500 hover:bg-primary-50"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => openCreate(cat.id)} className="p-1.5 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50" title="Subcategoría"><Plus className="h-4 w-4" /></button>
          <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>

        {cat.children && cat.children.length > 0 && expanded.has(cat.id) && (
          renderTree(cat.children, depth + 1)
        )}
      </div>
    ));
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
            <p className="text-gray-500 text-sm mt-1">{allFlat.length} categorías</p>
          </div>
          <button onClick={() => openCreate()}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
            <Plus className="h-4 w-4" /> Nueva categoría
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : tree.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay categorías</p>
          ) : (
            <div>{renderTree(tree)}</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal({ open: false })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <button onClick={() => setModal({ open: false })}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-5">{modal.category ? "Editar categoría" : "Nueva categoría"}</h2>

            <div className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Nombre</label>
                  <input value={form.name} onChange={e => { setForm({...form, name: e.target.value, slug: slugify(e.target.value)}); }}
                    className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Icono</label>
                  <label className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium cursor-pointer transition-colors ${form.iconFile ? "border-primary-300 bg-primary-50 text-primary-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                    <Upload className="h-4 w-4" />
                    {form.iconFile ? form.iconFile.name.slice(0, 10) : "SVG/PNG"}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setForm({...form, iconFile: file});
                        if (file) setPreviewIcon(URL.createObjectURL(file));
                      }} />
                  </label>
                </div>
              </div>

              {previewIcon && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <img src={previewIcon} className="w-6 h-6 object-contain" />
                  <span className="text-xs text-gray-500">Vista previa</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Slug</label>
                <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})}
                  className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Categoría padre</label>
                  <select value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})}
                    className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200">
                    <option value="">Ninguna (raíz)</option>
                    {allFlat.filter(c => c.id !== modal.category?.id).map(c => (
                      <option key={c.id} value={c.id}>{"\u00A0\u00A0".repeat(c.parent_id ? 1 : 0)}{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                    className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200">
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal({ open: false })}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                {saving ? "Guardando..." : modal.category ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function slugify(text: string) { return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
