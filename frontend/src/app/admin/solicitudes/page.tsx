"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminRequests, getAdminRequestOffers, adminCancelRequest } from "@/lib/api";
import { toast } from "sonner";
import { PackageSearch, Loader2, X, ChevronRight, Mail, Phone, Ban } from "lucide-react";

const ESTADO_LABEL: Record<string, string> = {
  abierta: "Abierta",
  aceptada: "Aceptada",
  cancelada: "Cancelada",
  expirada: "Expirada",
};

export default function AdminSolicitudesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);

  const PER_PAGE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminRequests({ estado: estado || undefined, q: search || undefined, page, limit: PER_PAGE });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch {
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  }, [estado, search, page]);

  useEffect(() => { load(); }, [load]);

  async function openOffers(r: any) {
    setSelected(r);
    setOffersLoading(true);
    setOffers([]);
    try {
      const data = await getAdminRequestOffers(r.id);
      setOffers(data || []);
    } catch {
      toast.error("Error al cargar ofertas");
    } finally {
      setOffersLoading(false);
    }
  }

  async function handleCancelRequest(id: string) {
    const motivo = prompt("Motivo de cancelación de solicitud por irregularidad:");
    if (!motivo?.trim()) return;
    setCancellingRequestId(id);
    try {
      await adminCancelRequest(id, motivo.trim());
      toast.success("Solicitud cancelada. Ofertas y garantías procesadas.");
      load();
    } catch {
      toast.error("Error al cancelar solicitud");
    } finally {
      setCancellingRequestId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 inline-flex items-center gap-2">
          <PackageSearch className="h-6 w-6 text-[#8234FE]" /> Solicitudes de compra
        </h1>
        <p className="text-sm text-gray-500 mb-6">Revisa solicitudes y las ofertas de cada vendedor (monitoreo anti-colusión).</p>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por título..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
          />
          <select value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }}
            className="md:w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
            <option value="">Todos los estados</option>
            <option value="abierta">Abierta</option>
            <option value="aceptada">Aceptada</option>
            <option value="cancelada">Cancelada</option>
            <option value="expirada">Expirada</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <PackageSearch className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Sin solicitudes.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Comprador</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Ofertas</th>
                  <th className="px-4 py-3">Aceptadas</th>
                  <th className="px-4 py-3">Rango</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.title}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.buyer?.first_name} {r.buyer?.last_name}
                      <p className="text-xs text-gray-400">{r.buyer?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.estado === "abierta" ? "bg-green-50 text-green-600" : r.estado === "aceptada" ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-500"
                      }`}>
                        {ESTADO_LABEL[r.estado] || r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{r.offers_count}</td>
                    <td className="px-4 py-3 text-gray-600">{r.accepted_count}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {r.precio_minimo != null ? `S/ ${Number(r.precio_minimo).toFixed(2)}` : "-"}
                      {" - "}
                      {r.precio_maximo != null ? `S/ ${Number(r.precio_maximo).toFixed(2)}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openOffers(r)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#8234FE] hover:underline">
                        Ver ofertas <ChevronRight className="w-3 h-3" />
                      </button>
                      {r.estado === "abierta" && (
                        <button onClick={() => handleCancelRequest(r.id)} disabled={cancellingRequestId === r.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline disabled:opacity-50">
                          {cancellingRequestId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                          Cancelar
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-400">Página {page} de {totalPages} · {total} solicitudes</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                Anterior
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de ofertas */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Ofertas · {selected.title}</h2>
                <p className="text-xs text-gray-400">Comprador: {selected.buyer?.first_name} {selected.buyer?.last_name} · {selected.buyer?.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {offersLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
            ) : offers.length === 0 ? (
              <p className="text-sm text-gray-500 py-10 text-center">Esta solicitud no tiene ofertas.</p>
            ) : (
              <div className="space-y-3">
                {offers.map(o => (
                  <div key={o.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{o.product?.title || "Producto"}</p>
                        <p className="text-xs text-gray-500">{o.seller?.first_name} {o.seller?.last_name}</p>
                        <p className="text-xs text-gray-400 inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {o.seller?.email}</p>
                        {o.seller?.phone && <p className="text-xs text-gray-400 inline-flex items-center gap-1 ml-2"><Phone className="w-3 h-3" /> {o.seller.phone}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#8234FE]">S/ {Number(o.precio).toFixed(2)} × {o.cantidad}</p>
                        <p className="text-xs text-gray-400">Envío: S/ {Number(o.costo_envio || 0).toFixed(2)}</p>
                        <span className={`inline-flex px-2 py-0.5 mt-1 rounded-full text-xs font-semibold ${
                          o.estado === "aceptada" ? "bg-green-50 text-green-600" : o.estado === "rechazada" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                        }`}>
                          {o.estado}
                        </span>
                        {o.garantia_pct && <p className="text-xs text-gray-400 mt-1">Garantía: {o.garantia_pct}%</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
