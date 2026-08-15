"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getUmbrales, saveUmbrales, Umbrales } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function UmbralesPage() {
  const [subasta, setSubasta] = useState("5");
  const [demanda, setDemanda] = useState("5");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUmbrales()
      .then((d) => {
        if (!d) return;
        setSubasta(String(d.garantia_subasta_inversa_pct));
        setDemanda(String(d.garantia_demanda_agregada_pct));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function validPct(v: string) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 && n <= 100;
  }

  async function handleSave() {
    if (!validPct(subasta)) { toast.error("La garantía de subasta inversa debe ser un % entre 1 y 100"); return; }
    if (!validPct(demanda)) { toast.error("La garantía de compra grupal debe ser un % entre 1 y 100"); return; }
    setSaving(true);
    try {
      const res = await saveUmbrales({
        garantia_subasta_inversa_pct: Number(subasta),
        garantia_demanda_agregada_pct: Number(demanda),
      });
      setSubasta(String(res.garantia_subasta_inversa_pct));
      setDemanda(String(res.garantia_demanda_agregada_pct));
      toast.success("Umbrales de pago actualizados");
    } catch (e: any) {
      toast.error(e.message || "Error al guardar umbrales");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900">Umbrales de pago</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Define el porcentaje de <b>garantía de compromiso</b> que se cobra como primer hito en cada modelo. El saldo
          (100% − garantía) se paga después de confirmar al proveedor. La garantía se imputa al precio final.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Subasta inversa (solicitudes de compra)
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Mínimo de garantía que los vendedores deben ofrecer al aceptarse su oferta. Una oferta puede elevar este %
                (hasta 100%).
              </p>
              <div className="flex items-center gap-3 max-w-xs">
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={subasta}
                  onChange={(e) => setSubasta(e.target.value)}
                  className="form-input-custom w-full"
                />
                <span className="text-sm text-gray-500 font-semibold">%</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Demanda agregada (compra grupal)
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Porcentaje cobrado a cada participante como garantía al cerrar el lote; el saldo se paga después.
              </p>
              <div className="flex items-center gap-3 max-w-xs">
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={demanda}
                  onChange={(e) => setDemanda(e.target.value)}
                  className="form-input-custom w-full"
                />
                <span className="text-sm text-gray-500 font-semibold">%</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8234FE] to-[#26BEFE] text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar umbrales
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
