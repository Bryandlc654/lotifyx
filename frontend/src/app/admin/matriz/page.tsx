"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getMatrixRules, createMatrixRule, updateMatrixRule, deleteMatrixRule, MatrixRule } from "@/lib/api/admin";
import { getCategories } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Check, X, Loader2, Grid3x3 } from "lucide-react";

const CANALES = [
  { value: "subasta", label: "Subasta" },
  { value: "demanda_agregada", label: "Demanda agregada (lote)" },
  { value: "subasta_inversa", label: "Subasta inversa (RFQ)" },
  { value: "oferta", label: "Oferta directa" },
];

const MODALIDADES = [
  { value: "", label: "Cualquier modalidad" },
  { value: "inglesa", label: "Subasta inglesa" },
  { value: "sobre_cerrado", label: "Sobre cerrado" },
];

const ACTORES = [
  { value: "todos", label: "Todos los usuarios" },
  { value: "comprador_verificado", label: "Comprador verificado" },
  { value: "empresa", label: "Empresa" },
  { value: "premium", label: "Premium" },
];

const DIVISIBILIDAD = [
  { value: "", label: "Sin restricción" },
  { value: "true", label: "Divisible" },
  { value: "false", label: "Indivisible" },
];

const canalLabel = (c: string) => CANALES.find(x => x.value === c)?.label || c;
const modalidadLabel = (m: string | null) => m ? MODALIDADES.find(x => x.value === m)?.label || m : "Cualquiera";
const actoresLabel = (a: string) => ACTORES.find(x => x.value === a)?.label || a;
const divLabel = (d: boolean | null) => d === null ? "Sin restricción" : d ? "Divisible" : "Indivisible";

export default function AdminMatrizPage() {
  const [rules, setRules] = useState<MatrixRule[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MatrixRule>>({});

  const [form, setForm] = useState({
    canal: "subasta",
    modalidad: "",
    categoria_id: "",
    divisibilidad_requerida: "",
    actores_permitidos: "todos",
  });

  async function load() {
    setLoading(true);
    try {
      const [r, cats] = await Promise.all([getMatrixRules(), getCategories()]);
      setRules(r);
      setCategorias(cats);
    } catch { toast.error("Error al cargar"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createMatrixRule({
        canal: form.canal,
        modalidad: form.modalidad || null,
        categoria_id: form.categoria_id || null,
        divisibilidad_requerida: form.divisibilidad_requerida === "" ? null : form.divisibilidad_requerida === "true",
        actores_permitidos: form.actores_permitidos,
      });
      toast.success("Regla creada");
      setForm({ canal: "subasta", modalidad: "", categoria_id: "", divisibilidad_requerida: "", actores_permitidos: "todos" });
      load();
    } catch (e: any) { toast.error(e.message || "Error al crear"); }
  }

  function startEdit(r: MatrixRule) {
    setEditing(r.id);
    setEditForm({
      canal: r.canal,
      modalidad: r.modalidad || "",
      categoria_id: r.categoria_id || "",
      divisibilidad_requerida: r.divisibilidad_requerida,
      actores_permitidos: r.actores_permitidos,
      activo: r.activo,
    });
  }

  async function saveEdit(id: string) {
    try {
      await updateMatrixRule(id, {
        canal: editForm.canal!,
        modalidad: editForm.modalidad || null,
        categoria_id: editForm.categoria_id || null,
        divisibilidad_requerida: editForm.divisibilidad_requerida,
        actores_permitidos: editForm.actores_permitidos!,
        activo: editForm.activo,
      });
      toast.success("Regla actualizada");
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message || "Error al actualizar"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta regla de matriz?")) return;
    try { await deleteMatrixRule(id); toast.success("Regla eliminada"); load(); }
    catch { toast.error("Error al eliminar"); }
  }

  async function toggleActivo(id: string, activo: boolean) {
    try { await updateMatrixRule(id, { activo }); load(); }
    catch { toast.error("Error al cambiar estado"); }
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Grid3x3 className="w-6 h-6 text-[#8234FE]" />
          <h1 className="text-2xl font-bold text-gray-900">Matriz Subasta</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Configura qué combinaciones de canal, modalidad, divisibilidad, actores y categoría están habilitadas.
          Solo las combinaciones registradas aquí estarán disponibles para los vendedores al crear productos.
        </p>

        {/* Formulario nueva regla */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">Nueva regla</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Canal *</label>
              <select value={form.canal} onChange={e => setForm({ ...form, canal: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                {CANALES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Modalidad</label>
              <select value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Categoría</label>
              <select value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Todas las categorías</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Divisibilidad</label>
              <select value={form.divisibilidad_requerida} onChange={e => setForm({ ...form, divisibilidad_requerida: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                {DIVISIBILIDAD.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Actores permitidos</label>
              <select value={form.actores_permitidos} onChange={e => setForm({ ...form, actores_permitidos: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                {ACTORES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <button type="submit"
              className="flex items-center justify-center gap-1 bg-[#8234FE] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-purple-700 transition-colors">
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </form>
        </div>

        {/* Tabla de reglas */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando...
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No hay reglas configuradas</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Canal</th>
                    <th className="px-4 py-3 text-left">Modalidad</th>
                    <th className="px-4 py-3 text-left">Categoría</th>
                    <th className="px-4 py-3 text-left">Divisibilidad</th>
                    <th className="px-4 py-3 text-left">Actores</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rules.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      {editing === r.id ? (
                        <>
                          <td className="px-4 py-2">
                            <select value={editForm.canal} onChange={e => setEditForm({ ...editForm, canal: e.target.value })}
                              className="w-full border rounded px-2 py-1 text-xs">
                              {CANALES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <select value={editForm.modalidad || ""} onChange={e => setEditForm({ ...editForm, modalidad: e.target.value })}
                              className="w-full border rounded px-2 py-1 text-xs">
                              {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <select value={editForm.categoria_id || ""} onChange={e => setEditForm({ ...editForm, categoria_id: e.target.value })}
                              className="w-full border rounded px-2 py-1 text-xs">
                              <option value="">Todas</option>
                              {categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <select value={editForm.divisibilidad_requerida === null ? "" : String(editForm.divisibilidad_requerida)}
                              onChange={e => setEditForm({ ...editForm, divisibilidad_requerida: e.target.value === "" ? null : e.target.value === "true" })}
                              className="w-full border rounded px-2 py-1 text-xs">
                              {DIVISIBILIDAD.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <select value={editForm.actores_permitidos} onChange={e => setEditForm({ ...editForm, actores_permitidos: e.target.value })}
                              className="w-full border rounded px-2 py-1 text-xs">
                              {ACTORES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button onClick={() => setEditForm({ ...editForm, activo: !editForm.activo })}
                              className={`w-8 h-5 rounded-full transition-colors ${editForm.activo ? "bg-green-500" : "bg-gray-300"}`}>
                              <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${editForm.activo ? "translate-x-3.5" : "translate-x-0.5"}`} />
                            </button>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button onClick={() => saveEdit(r.id)} className="text-green-600 hover:text-green-700 mr-2"><Check className="w-4 h-4 inline" /></button>
                            <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4 inline" /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium text-gray-800">{canalLabel(r.canal)}</td>
                          <td className="px-4 py-3 text-gray-600">{modalidadLabel(r.modalidad)}</td>
                          <td className="px-4 py-3 text-gray-600">{r.categoria_nombre || "Todas"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              r.divisibilidad_requerida === true ? "bg-blue-50 text-blue-600" :
                              r.divisibilidad_requerida === false ? "bg-orange-50 text-orange-600" :
                              "bg-gray-100 text-gray-500"
                            }`}>{divLabel(r.divisibilidad_requerida)}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{actoresLabel(r.actores_permitidos)}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => toggleActivo(r.id, !r.activo)}
                              className={`w-8 h-5 rounded-full transition-colors ${r.activo ? "bg-green-500" : "bg-gray-300"}`}>
                              <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${r.activo ? "translate-x-3.5" : "translate-x-0.5"}`} />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => startEdit(r)} className="text-gray-400 hover:text-blue-600 mr-2"><Edit className="w-4 h-4 inline" /></button>
                            <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
