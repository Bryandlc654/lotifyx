"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getGarantiaRules, saveGarantiaRule, deleteGarantiaRule, GarantiaRule } from "@/lib/api/config";
import { useAuth } from "@/lib/use-auth";

const CANALES = [
  { value: "oferta", label: "Oferta (compra directa)" },
  { value: "subasta_inversa", label: "Subasta inversa (RFQ)" },
  { value: "demanda_agregada", label: "Demanda agregada (lotes)" },
];

export default function AdminGarantiasPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState<GarantiaRule[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [canal, setCanal] = useState("oferta");
  const [categoria, setCategoria] = useState("");
  const [pct, setPct] = useState("");
  const [minMonto, setMinMonto] = useState("0");
  const [topeMonto, setTopeMonto] = useState("");
  const [redondeo, setRedondeo] = useState("0.01");

  const canEdit = !!user?.permissions?.includes("config.umbrales");

  async function load() {
    setLoading(true);
    try {
      const data = await getGarantiaRules();
      setRules(data.rules);
      setCategorias(data.categorias);
    } catch (e: any) {
      toast.error(e.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return toast.error("Sin permiso para editar umbrales");
    const p = pct === "" ? null : Number(pct);
    if (p !== null && (!Number.isFinite(p) || p < 0 || p > 100)) return toast.error("El % debe estar entre 0 y 100");
    const m = Number(minMonto);
    if (!Number.isFinite(m) || m < 0) return toast.error("El mínimo no puede ser negativo");
    const t = topeMonto === "" ? null : Number(topeMonto);
    if (t !== null && (!Number.isFinite(t) || t < 0)) return toast.error("El tope no puede ser negativo");
    const r = Number(redondeo);
    if (!Number.isFinite(r) || r <= 0) return toast.error("El redondeo debe ser mayor a 0");
    try {
      await saveGarantiaRule({
        canal,
        categoria_id: categoria || null,
        pct: p,
        min_monto: m,
        tope_monto: t,
        redondeo: r,
      });
      toast.success("Regla guardada");
      setPct(""); setTopeMonto(""); setMinMonto("0"); setRedondeo("0.01"); setCategoria("");
      load();
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    }
  }

  async function handleDelete(id: string) {
    if (!canEdit) return toast.error("Sin permiso");
    if (!confirm("¿Eliminar esta regla?")) return;
    try {
      await deleteGarantiaRule(id);
      toast.success("Regla eliminada");
      load();
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar");
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reglas de garantía</h1>
      <p className="text-sm text-gray-500 mb-6">
        Define el % de garantía por canal y, opcionalmente, por categoría. Se aplica la regla más específica
        (categoría &gt; canal &gt; fórmula global de Umbrales). El monto calculado respeta mínimo, tope y redondeo.
      </p>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Canal</label>
            <select value={canal} onChange={(e) => setCanal(e.target.value)} className="form-input-custom w-full" disabled={!canEdit}>
              {CANALES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Categoría (opcional)</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="form-input-custom w-full" disabled={!canEdit}>
              <option value="">Todas (regla general del canal)</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">% garantía (vacío = usa Umbrales)</label>
            <input type="number" min="0" max="100" step="1" value={pct} onChange={(e) => setPct(e.target.value)} className="form-input-custom w-full" disabled={!canEdit} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Mínimo (S/)</label>
            <input type="number" min="0" step="0.01" value={minMonto} onChange={(e) => setMinMonto(e.target.value)} className="form-input-custom w-full" disabled={!canEdit} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Tope (S/, vacío = sin tope)</label>
            <input type="number" min="0" step="0.01" value={topeMonto} onChange={(e) => setTopeMonto(e.target.value)} className="form-input-custom w-full" disabled={!canEdit} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Redondeo (S/)</label>
            <input type="number" min="0.01" step="0.01" value={redondeo} onChange={(e) => setRedondeo(e.target.value)} className="form-input-custom w-full" disabled={!canEdit} />
          </div>
        </div>
        <button type="submit" disabled={!canEdit} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
          Guardar regla
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Reglas activas</h2>
        {loading ? <p className="text-sm text-gray-400">Cargando…</p> : (
          rules.length === 0 ? <p className="text-sm text-gray-400">No hay reglas específicas. Se usa la fórmula global de Umbrales.</p> :
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-slate-100">
                  <th className="py-2 pr-3">Canal</th>
                  <th className="py-2 pr-3">Categoría</th>
                  <th className="py-2 pr-3">%</th>
                  <th className="py-2 pr-3">Mín</th>
                  <th className="py-2 pr-3">Tope</th>
                  <th className="py-2 pr-3">Red</th>
                  <th className="py-2 pr-3">Activo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50">
                    <td className="py-2 pr-3">{CANALES.find((c) => c.value === r.canal)?.label || r.canal}</td>
                    <td className="py-2 pr-3">{r.categoria_nombre || "Todas"}</td>
                    <td className="py-2 pr-3">{r.pct ?? "—"}</td>
                    <td className="py-2 pr-3">{r.min_monto}</td>
                    <td className="py-2 pr-3">{r.tope_monto ?? "—"}</td>
                    <td className="py-2 pr-3">{r.redondeo}</td>
                    <td className="py-2 pr-3">{r.activo ? "Sí" : "No"}</td>
                    <td className="py-2">
                      {canEdit && <button onClick={() => handleDelete(r.id)} className="text-red-600 text-xs hover:underline">Eliminar</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
