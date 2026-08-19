"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getCollusionFlags, resolveCollusionFlag, getFlaggedUsers, clearUserCollusionFlag, getSanctionedUsers, clearSanction } from "@/lib/api";
import { toast } from "sonner";
import { ShieldAlert, AlertTriangle, Check, Loader2 } from "lucide-react";

const RULE_LABEL: Record<string, string> = {
  precio_identico: "Precio idéntico",
  misma_ip: "Misma IP",
  mismo_dispositivo: "Mismo dispositivo",
  historial_ofertas_identicas: "Historial: ofertas idénticas",
  comprador_mismo_vendedor: "Comprador mismo vendedor",
};

const SEVERITY: Record<string, string> = {
  alta: "bg-red-50 text-red-700 border-red-100",
  media: "bg-amber-50 text-amber-700 border-amber-100",
  baja: "bg-yellow-50 text-yellow-700 border-yellow-100",
};

export default function AdminCollusionPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState<any[]>([]);
  const [sanctioned, setSanctioned] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, u, s] = await Promise.all([getCollusionFlags(status || undefined), getFlaggedUsers(), getSanctionedUsers()]);
      setFlags(f || []);
      setFlaggedUsers(u || []);
      setSanctioned(s || []);
    } catch {
      toast.error("Error al cargar alertas de colusión");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  async function resolve(id: string) {
    setBusyId(id);
    try {
      await resolveCollusionFlag(id);
      toast.success("Alerta resuelta");
      load();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setBusyId(null);
    }
  }

  async function clearUser(id: string) {
    setBusyId(id);
    try {
      await clearUserCollusionFlag(id);
      toast.success("Cuenta desmarcada");
      load();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setBusyId(null);
    }
  }

  async function removeSanction(id: string) {
    setBusyId(id);
    try {
      await clearSanction(id);
      toast.success("Sanción eliminada");
      load();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setBusyId(null);
    }
  }

  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }) : "-");

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-1">
          <ShieldAlert className="h-6 w-6 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Detección de colusión</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Alertas automáticas por coordinación artificial de precios: montos idénticos, misma IP o dispositivo, o historial repetitivo.
        </p>

        {flaggedUsers.length > 0 && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-red-700 mb-3 inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Cuentas marcadas como sospechosas ({flaggedUsers.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-red-100">
                    <th className="py-2">Usuario</th>
                    <th className="py-2">Alertas abiertas</th>
                    <th className="py-2">Nota</th>
                    <th className="py-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedUsers.map((u: any) => (
                    <tr key={u.id} className="border-b border-red-50">
                      <td className="py-2">
                        <p className="font-medium text-gray-800">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </td>
                      <td className="py-2">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                          {u.alertas_abiertas}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-gray-500">{u.collusion_note || "-"}</td>
                      <td className="py-2">
                        <button
                          onClick={() => clearUser(u.id)}
                          disabled={busyId === u.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                        >
                          {busyId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Desmarcar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sanctioned.length > 0 && (
          <div className="mb-8 bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-orange-700 mb-3">
              Sancionados por incumplimiento de pago ({sanctioned.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-orange-100">
                    <th className="py-2">Usuario</th>
                    <th className="py-2">Incumplimientos</th>
                    <th className="py-2">Sanción hasta</th>
                    <th className="py-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {sanctioned.map((s: any) => (
                    <tr key={s.id} className="border-b border-orange-50">
                      <td className="py-2">
                        <p className="font-medium text-gray-800">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                      </td>
                      <td className="py-2">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                          {s.incumplimientos_count}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-gray-600">
                        {s.sancionado ? (s.sancion_hasta ? new Date(s.sancion_hasta).toLocaleDateString("es-PE") : "Indefinida") : "No sancionado"}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => removeSanction(s.id)}
                          disabled={busyId === s.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline disabled:opacity-50"
                        >
                          {busyId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Quitar sanción
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mb-4">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
            <option value="">Todos los estados</option>
            <option value="abierto">Abiertos</option>
            <option value="resuelto">Resueltos</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
        ) : flags.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <ShieldAlert className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Sin alertas de colusión.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flags.map(f => (
              <div key={f.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${SEVERITY[f.severity] || SEVERITY.media}`}>
                      {f.severity}
                    </span>
                    <span className="font-semibold text-gray-800">{RULE_LABEL[f.rule] || f.rule}</span>
                    <span className="text-xs text-gray-400">{f.event_type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${f.status === "abierto" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}>
                      {f.status}
                    </span>
                    <span className="text-xs text-gray-400">{fmtDate(f.created_at)}</span>
                    {f.status === "abierto" && (
                      <button
                        onClick={() => resolve(f.id)}
                        disabled={busyId === f.id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline disabled:opacity-50"
                      >
                        {busyId === f.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Resolver
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Usuarios: {Array.isArray(f.users) ? f.users.map((u: any) => u.email).join(", ") : f.user_ids?.length ? `${f.user_ids.length} usuarios` : "-"}
                  {f.detail?.monto ? ` · Monto: S/ ${Number(f.detail.monto).toFixed(2)}` : ""}
                  {f.detail?.ip ? ` · IP: ${f.detail.ip}` : ""}
                  {f.detail?.veces ? ` · ${f.detail.veces} veces` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
