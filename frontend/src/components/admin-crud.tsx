"use client";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";

interface CrudColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface CrudField {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "file";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface AdminCrudProps {
  title: string;
  columns: CrudColumn[];
  fields: CrudField[];
  load: () => Promise<any[]>;
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  remove: (id: string) => Promise<any>;
  initialForm?: Record<string, any>;
  keyExtractor?: (item: any) => string;
}

export function AdminCrud({ title, columns, fields, load, create, update, remove, initialForm = {}, keyExtractor = (i) => i.id }: AdminCrudProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ ...initialForm });

  async function loadItems() {
    setLoading(true);
    try {
      const data = await load();
      setItems(data);
    } catch { toast.error("Error al cargar"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadItems(); }, []);

  async function handleCreate() {
    try {
      await create(form);
      toast.success("Creado");
      setShowForm(false);
      setForm({ ...initialForm });
      loadItems();
    } catch { toast.error("Error al crear"); }
  }

  async function handleUpdate(id: string) {
    try {
      await update(id, form);
      toast.success("Actualizado");
      setEditingId(null);
      setShowForm(false);
      setForm({ ...initialForm });
      loadItems();
    } catch { toast.error("Error al actualizar"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar?")) return;
    try {
      await remove(id);
      toast.success("Eliminado");
      loadItems();
    } catch { toast.error("Error al eliminar"); }
  }

  function openEdit(item: any) {
    setForm({ ...initialForm, ...item });
    setEditingId(keyExtractor(item));
    setShowForm(true);
  }

  function openCreate() {
    setForm({ ...initialForm });
    setEditingId(null);
    setShowForm(true);
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <button onClick={openCreate} className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors">
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>

        {showForm && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {fields.map((f) => (
                <div key={f.name} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea value={form[f.name] || ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500" rows={3} placeholder={f.placeholder} />
                  ) : f.type === "select" ? (
                    <select value={form[f.name] || ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500">
                      <option value="">Seleccionar</option>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={f.type || "text"} value={form[f.name] || ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500" placeholder={f.placeholder} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={editingId ? () => handleUpdate(editingId) : handleCreate}
                className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors">
                <Check className="w-4 h-4" /> {editingId ? "Actualizar" : "Crear"}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...initialForm }); }}
                className="flex items-center gap-1.5 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors">
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No hay registros</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.map((col) => <th key={col.key} className="text-left px-4 py-3 font-semibold text-gray-600">{col.label}</th>)}
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={keyExtractor(item)} className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">{col.render ? col.render(item[col.key], item) : String(item[col.key] ?? "")}</td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(keyExtractor(item))} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
