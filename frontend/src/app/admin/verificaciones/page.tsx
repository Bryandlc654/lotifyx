"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminVerifications, approveVerification, rejectVerification, AdminVerification } from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import { toast } from "sonner";
import { ShieldCheck, ShieldX, X, Check, FileText, MapPin } from "lucide-react";

const METODO_LABEL: Record<string, string> = { subasta: "Subasta", venta_por_lote: "Compra grupal", plataforma: "Plataforma" };

export default function VerificacionesPage() {
  const [list, setList] = useState<AdminVerification[]>([]);
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminVerification | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, [estado]);

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminVerifications(estado || undefined);
      setList(data);
    } catch { toast.error("Error al cargar verificaciones"); }
    finally { setLoading(false); }
  }

  function open(item: AdminVerification) {
    setSelected(item);
    setObservaciones("");
  }

  async function act(action: "approve" | "reject") {
    if (!selected) return;
    if (action === "reject" && !observaciones.trim()) { toast.error("Indica el motivo del rechazo"); return; }
    setBusy(true);
    try {
      if (action === "approve") await approveVerification(selected.id, observaciones || undefined);
      else await rejectVerification(selected.id, observaciones);
      toast.success(action === "approve" ? "Verificación aprobada" : "Verificación rechazada");
      setSelected(null);
      load();
    } catch (e: any) { toast.error(e.message || "Error"); }
    finally { setBusy(false); }
  }

  function SpecsTable({ specs }: { specs: Record<string, any> }) {
    const rows = Object.entries(specs || {});
    if (rows.length === 0) return <p className="text-sm text-gray-400 py-3">Sin ficha técnica</p>;
    return (
      <div className="max-h-56 overflow-y-auto">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([k, v]) => {
              const isImg = typeof v === "string" && (v.startsWith("/uploads/") || v.startsWith("http"));
              return (
                <tr key={k} className="border-b border-gray-50">
                  <td className="py-1.5 pr-3 text-gray-500 font-medium w-1/3 align-top">{k}</td>
                  <td className="py-1.5 text-gray-800">
                    {isImg ? (
                      <img src={getImageUrl(v)} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    ) : (
                      <span className="break-all">{String(v ?? "")}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  const statusBadge = (est: string) => {
    const map: Record<string, string> = {
      pendiente: "bg-amber-100 text-amber-700",
      aprobada: "bg-green-100 text-green-700",
      rechazada: "bg-red-100 text-red-700",
    };
    const label: Record<string, string> = { pendiente: "Pendiente", aprobada: "Aprobada", rechazada: "Rechazada" };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[est] || "bg-gray-100 text-gray-600"}`}>{label[est] || est}</span>;
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Verificaciones de stock y ficha técnica</h1>
            <p className="text-gray-500 text-sm mt-1">
              Revisa la evidencia aportada por los vendedores en subastas y compras grupales. La verificación no sustituye la obligación de entrega del vendedor ni implica garantía absoluta de LOTIFYX.
            </p>
          </div>
          <div className="flex gap-2">
            {["", "pendiente", "aprobada", "rechazada"].map(s => (
              <button key={s} onClick={() => setEstado(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${estado === s ? "bg-gradient-to-br from-[#8234FE] to-[#26BEFE] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {s === "" ? "Todas" : s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : list.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay verificaciones {estado ? `en estado "${estado}"` : ""}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Vendedor</th>
                    <th className="px-4 py-3 font-medium">Categoría</th>
                    <th className="px-4 py-3 font-medium">Método</th>
                    <th className="px-4 py-3 font-medium">Evidencia</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Enviada</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.map(item => {
                    const fotos = item.payload?.fotografias?.length || 0;
                    const hasVideo = !!item.payload?.video;
                    const docs = item.payload?.documentos?.length || 0;
                    return (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-400">{item.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.seller_email}</td>
                        <td className="px-4 py-3 text-gray-600">{item.category_name}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{METODO_LABEL[item.metodo_pago] || item.metodo_pago}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {fotos} foto{fotos !== 1 && "s"}{hasVideo ? " · video" : ""}{docs > 0 ? ` · ${docs} doc${docs !== 1 && "s"}` : ""}
                        </td>
                        <td className="px-4 py-3">{statusBadge(item.estado)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(item.created_at).toLocaleDateString("es-PE")}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => open(item)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50">Revisar</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelected(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{selected.title}</h2>
            <p className="text-sm text-gray-400 mb-4">{selected.sku} · {selected.seller_email} · {selected.category_name} · {METODO_LABEL[selected.metodo_pago] || selected.metodo_pago}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-purple-500" /> Ficha técnica declarada</h3>
                <SpecsTable specs={selected.specifications} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-purple-500" /> Evidencia aportada</h3>
                <div className="space-y-4">
                  {(selected.payload?.fotografias || []).length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Fotografías</p>
                      <div className="flex flex-wrap gap-2">
                        {(selected.payload.fotografias || []).map((u, i) => (
                          <a key={i} href={getImageUrl(u)} target="_blank" rel="noreferrer">
                            <img src={getImageUrl(u)} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.payload?.video && (
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Video</p>
                      <video src={getImageUrl(selected.payload.video)} className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-black" controls />
                    </div>
                  )}
                  {(selected.payload?.documentos || []).length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Documentos</p>
                      <div className="space-y-1">
                        {(selected.payload.documentos || []).map((u, i) => (
                          <a key={i} href={getImageUrl(u)} target="_blank" rel="noreferrer" className="block text-sm text-purple-700 underline truncate">Documento {i + 1}</a>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.payload?.numero_serie && (
                    <p className="text-sm text-gray-600"><span className="text-gray-400 font-medium">Número de serie:</span> {selected.payload.numero_serie}</p>
                  )}
                  {selected.payload?.capacidad_produccion && (
                    <p className="text-sm text-gray-600">
                      <span className="text-gray-400 font-medium">Capacidad de producción:</span> {selected.payload.capacidad_produccion.unidades_mes} unidades/mes{selected.payload.capacidad_produccion.plazo ? ` · plazo ${selected.payload.capacidad_produccion.plazo}` : ""}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {selected.ubicacion || "Sin ubicación"} · Condición: <span className="capitalize">{selected.product_estado || "—"}</span>
                  </div>
                  <p className={`text-sm ${selected.payload?.declaracion_ficha ? "text-green-700" : "text-red-600"}`}>
                    {selected.payload?.declaracion_ficha ? "Declaró correspondencia de la ficha técnica con la evidencia" : "No declaró correspondencia de la ficha técnica"}
                  </p>
                  {selected.observaciones && (
                    <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">Observación: {selected.observaciones}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700 block mb-1">Observaciones {selected.estado === "rechazada" ? "(motivo del rechazo)" : "(opcional)"}</label>
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" rows={2}
                placeholder="Comentarios para el vendedor..." />
            </div>

            {selected.estado === "pendiente" && (
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => act("reject")} disabled={busy}
                  className="flex items-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
                  <ShieldX className="h-4 w-4" /> Rechazar
                </button>
                <button onClick={() => act("approve")} disabled={busy}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
                  <Check className="h-4 w-4" /> Aprobar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
