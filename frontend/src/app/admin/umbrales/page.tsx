"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getUmbrales, saveUmbrales, Umbrales } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function UmbralesPage() {
  const [subasta, setSubasta] = useState("5");
  const [demanda, setDemanda] = useState("5");
  const [limiteDias, setLimiteDias] = useState("3");
  const [maxInc, setMaxInc] = useState("2");
  const [sancionDias, setSancionDias] = useState("7");
  const [garantiaOferta, setGarantiaOferta] = useState("1");
  const [maxOfertas, setMaxOfertas] = useState("10");
  const [maxPujas, setMaxPujas] = useState("5");
  const [reconexionDias, setReconexionDias] = useState("3");
  const [sessionTimeout, setSessionTimeout] = useState("120");
  const [maxLogin, setMaxLogin] = useState("5");
  const [bloqueoLogin, setBloqueoLogin] = useState("15");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUmbrales()
      .then((d) => {
        if (!d) return;
        setSubasta(String(d.garantia_subasta_inversa_pct));
        setDemanda(String(d.garantia_demanda_agregada_pct));
        setLimiteDias(String(d.limite_pago_dias ?? 3));
        setMaxInc(String(d.max_incumplimientos ?? 2));
        setSancionDias(String(d.sancion_dias ?? 7));
        setGarantiaOferta(String(d.garantia_oferta_pct ?? 1));
        setMaxOfertas(String(d.max_ofertas_pendientes ?? 10));
        setMaxPujas(String(d.max_pujas_pendientes ?? 5));
        setReconexionDias(String(d.reconexion_dias ?? 3));
        setSessionTimeout(String(d.session_timeout_minutos ?? 120));
        setMaxLogin(String(d.max_login_intentos ?? 5));
        setBloqueoLogin(String(d.bloqueo_login_minutos ?? 15));
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
    const dias = Number(limiteDias);
    if (!Number.isFinite(dias) || dias <= 0 || dias > 90) { toast.error("El límite de días debe ser entre 1 y 90"); return; }
    const max = Number(maxInc);
    if (!Number.isFinite(max) || max <= 0 || max > 20) { toast.error("El máximo de incumplimientos debe ser entre 1 y 20"); return; }
    const sd = Number(sancionDias);
    if (!Number.isFinite(sd) || sd <= 0 || sd > 365) { toast.error("Los días de sanción deben ser entre 1 y 365"); return; }
    const go = Number(garantiaOferta);
    if (!Number.isFinite(go) || go < 0 || go > 100) { toast.error("La garantía de oferta debe ser un % entre 0 y 100"); return; }
    const mo = Number(maxOfertas);
    if (!Number.isFinite(mo) || mo <= 0 || mo > 100) { toast.error("El máximo de ofertas debe ser entre 1 y 100"); return; }
    const mp = Number(maxPujas);
    if (!Number.isFinite(mp) || mp <= 0 || mp > 50) { toast.error("El máximo de pujas debe ser entre 1 y 50"); return; }
    const rd = Number(reconexionDias);
    if (!Number.isFinite(rd) || rd <= 0 || rd > 30) { toast.error("Los días de reconexión deben ser entre 1 y 30"); return; }
    const st = Number(sessionTimeout);
    if (!Number.isFinite(st) || st < 1 || st > 1440) { toast.error("El tiempo de sesión debe ser entre 1 y 1440 minutos"); return; }
    const ml = Number(maxLogin);
    if (!Number.isFinite(ml) || ml <= 0 || ml > 20) { toast.error("El máximo de intentos de login debe ser entre 1 y 20"); return; }
    const bl = Number(bloqueoLogin);
    if (!Number.isFinite(bl) || bl <= 0 || bl > 1440) { toast.error("El bloqueo de login debe ser entre 1 y 1440 minutos"); return; }
    setSaving(true);
    try {
      const res = await saveUmbrales({
        garantia_subasta_inversa_pct: Number(subasta),
        garantia_demanda_agregada_pct: Number(demanda),
        limite_pago_dias: dias,
        max_incumplimientos: max,
        sancion_dias: sd,
        garantia_oferta_pct: go,
        max_ofertas_pendientes: mo,
        max_pujas_pendientes: mp,
        reconexion_dias: rd,
        session_timeout_minutos: st,
        max_login_intentos: ml,
        bloqueo_login_minutos: bl,
      });
      setSubasta(String(res.garantia_subasta_inversa_pct));
      setDemanda(String(res.garantia_demanda_agregada_pct));
      setLimiteDias(String(res.limite_pago_dias ?? dias));
      setMaxInc(String(res.max_incumplimientos ?? max));
      setSancionDias(String(res.sancion_dias ?? sd));
      setGarantiaOferta(String(res.garantia_oferta_pct ?? go));
      setMaxOfertas(String(res.max_ofertas_pendientes ?? mo));
      setMaxPujas(String(res.max_pujas_pendientes ?? mp));
      setReconexionDias(String(res.reconexion_dias ?? rd));
      setSessionTimeout(String(res.session_timeout_minutos ?? st));
      setMaxLogin(String(res.max_login_intentos ?? ml));
      setBloqueoLogin(String(res.bloqueo_login_minutos ?? bl));
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

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Límite de días para pagar
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Si una oferta/puja aceptada no se paga dentro de este plazo, la orden se cancela automáticamente.
              </p>
              <div className="flex items-center gap-3 max-w-xs">
                <input
                  type="number"
                  min="1"
                  max="90"
                  step="1"
                  value={limiteDias}
                  onChange={(e) => setLimiteDias(e.target.value)}
                  className="form-input-custom w-full"
                />
                <span className="text-sm text-gray-500 font-semibold">días</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Penalización por no pagar
              </label>
              <p className="text-xs text-gray-400 mb-4">
                Si alguien presenta una oferta/puja y no paga, se le sanciona: su cuenta se suspende para pujar y ofertar.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Máximo de incumplimientos</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="20" step="1" value={maxInc}
                      onChange={(e) => setMaxInc(e.target.value)} className="form-input-custom w-full" />
                    <span className="text-sm text-gray-500 font-semibold">veces</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Nº de pedidos no pagados antes de sancionar.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Días de suspensión</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="365" step="1" value={sancionDias}
                      onChange={(e) => setSancionDias(e.target.value)} className="form-input-custom w-full" />
                    <span className="text-sm text-gray-500 font-semibold">días</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Tiempo que la cuenta no puede pujar ni ofertar.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Compromiso y reconexión
              </label>
              <p className="text-xs text-gray-400 mb-4">
                Controles contra ofertas ficticias: garantía de oferta, límites anti-flood y reconexión al siguiente postor.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Garantía de oferta (RFQ)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="100" step="1" value={garantiaOferta}
                      onChange={(e) => setGarantiaOferta(e.target.value)} className="form-input-custom w-full" />
                    <span className="text-sm text-gray-500 font-semibold">%</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">% del monto que el vendedor debe reservar de su billetera para ofertar.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Máx. ofertas pendientes</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="100" step="1" value={maxOfertas}
                      onChange={(e) => setMaxOfertas(e.target.value)} className="form-input-custom w-full" />
                    <span className="text-sm text-gray-500 font-semibold">ofertas</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Límite de ofertas activas por vendedor (anti-flood).</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Máx. pujas pendientes</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="50" step="1" value={maxPujas}
                      onChange={(e) => setMaxPujas(e.target.value)} className="form-input-custom w-full" />
                    <span className="text-sm text-gray-500 font-semibold">pujas</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Límite de pujas sin pagar por usuario (anti-flood).</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Reconexión del ganador</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="30" step="1" value={reconexionDias}
                      onChange={(e) => setReconexionDias(e.target.value)} className="form-input-custom w-full" />
                    <span className="text-sm text-gray-500 font-semibold">días</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Espera antes de adjudicar al siguiente postor si el ganador no paga.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Sesión y acceso
              </label>
              <p className="text-xs text-gray-400 mb-4">
                Control de sesión por inactividad y bloqueo por intentos fallidos de inicio de sesión.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Tiempo de sesión</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="1440" step="1" value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)} className="form-input-custom w-full" />
                    <span className="text-sm text-gray-500 font-semibold">min</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Minutos de inactividad antes de cerrar la sesión (JWT).</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Máx. intentos de login</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="20" step="1" value={maxLogin}
                      onChange={(e) => setMaxLogin(e.target.value)} className="form-input-custom w-full" />
                    <span className="text-sm text-gray-500 font-semibold">intentos</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Intentos fallidos antes de bloquear la cuenta.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Bloqueo de login</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="1440" step="1" value={bloqueoLogin}
                      onChange={(e) => setBloqueoLogin(e.target.value)} className="form-input-custom w-full" />
                    <span className="text-sm text-gray-500 font-semibold">min</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Duración del bloqueo tras superar los intentos.</p>
                </div>
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
