"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminLots, getAdminLotDetail, saveAdminLotPricing, approveProduct, rejectProduct, deleteProduct, getAdminUsers, getCategories } from "@/lib/api";
import { Check, X, Eye, Search, XCircle, Trash2, ArrowUpDown, Layers, Users } from "lucide-react";
import { toast } from "sonner";

const STATUSES = [
  { value: "all", label: "Todos" },
  { value: "draft,pending_approval", label: "Pendientes" },
  { value: "active", label: "Activos" },
  { value: "rejected", label: "Rechazados" },
  { value: "draft", label: "Borrador" },
];

const statusLabel: Record<string, string> = {
  active: "Activo",
  rejected: "Rechazado",
  pending_approval: "Pendiente",
  draft: "Borrador",
};

const statusColor: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  pending_approval: "bg-yellow-50 text-yellow-700",
  draft: "bg-gray-100 text-gray-600",
};

const lotStatusLabel: Record<string, string> = {
  abierto: "Abierto",
  pendiente: "Pendiente",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
};

const lotStatusColor: Record<string, string> = {
  abierto: "bg-green-50 text-green-700",
  pendiente: "bg-yellow-50 text-yellow-700",
  cerrado: "bg-blue-50 text-blue-700",
  cancelado: "bg-red-50 text-red-700",
};

interface LotRow {
  id: string;
  title: string;
  sku?: string;
  user_id: string;
  category_id: string;
  status: string;
  stock: number;
  created_at: string;
  precio_lote: number | null;
  precio_individual: number | null;
  participantes_minimos: number | null;
  cmc: number | null;
  cantidad_total: number | null;
  meta_venta?: number | null;
  destacado?: boolean;
  rcg_tiers?: any[];
  cierre_estimado: string | null;
  lot_estado: string | null;
  cantidad_reservada: number;
  participantes_count: number;
}

interface LotDetail {
  lot: any;
  tiers: any[];
  participants: any[];
  benefits: any[];
}

export default function AdminLotesPage() {
  const [items, setItems] = useState<LotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("draft,pending_approval");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<LotRow | null>(null);
  const [lotDetail, setLotDetail] = useState<LotDetail | null>(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [pricingMeta, setPricingMeta] = useState("");
  const [pricingSaving, setPricingSaving] = useState(false);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [deleteConfirm, setDeleteConfirm] = useState<LotRow | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, [statusFilter, sortOrder, page]);

  useEffect(() => {
    getAdminUsers({ limit: 9999 }).then(res => {
      const map: Record<string, string> = {};
      res.data.forEach((u: any) => {
        const name = u.profile ? [u.profile.first_name, u.profile.last_name].filter(Boolean).join(" ").trim() : "";
        map[u.id] = name || u.email;
      });
      setUserMap(map);
    }).catch(() => {});
    getCategories().then(cats => {
      const map: Record<string, string> = {};
      cats.forEach(c => { map[c.id] = c.name; });
      setCategoryMap(map);
    }).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const status = statusFilter === "all" ? "" : statusFilter;
      const res = await getAdminLots(status || undefined, sortOrder, page);
      setItems(res.data as unknown as LotRow[]);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch {
      toast.error("Error al cargar lotes");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveProduct(id);
      toast.success("Lote aprobado");
      setItems(prev => prev.map(p => p.id === id ? { ...p, status: "active" } : p));
    } catch {
      toast.error("Error al aprobar");
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectProduct(id);
      toast.success("Lote rechazado");
      setItems(prev => prev.map(p => p.id === id ? { ...p, status: "rejected" } : p));
    } catch {
      toast.error("Error al rechazar");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProduct(id);
      toast.success("Lote eliminado");
      setItems(prev => prev.filter(p => p.id !== id));
      setDeleteConfirm(null);
    } catch {
      toast.error("Error al eliminar lote");
    }
  }

  async function openDetail(p: LotRow) {
    setDetail(p);
    setLotDetail(null);
    try {
      const d = await getAdminLotDetail(p.id);
      setLotDetail(d);
    } catch {
      toast.error("Error al cargar detalle del lote");
    }
  }

  function openPricing() {
    const d = lotDetail;
    setPricingTiers((d?.tiers || []).map(t => ({ ...t })));
    setPricingMeta(d?.lot?.meta_venta != null ? String(d.lot.meta_venta) : "");
    setPricingOpen(true);
  }

  async function savePricing() {
    if (!detail) return;
    setPricingSaving(true);
    try {
      const clean = pricingTiers
        .filter(t => t.desde != null && t.desde !== "")
        .map(t => ({
          desde: Number(t.desde) || 1,
          hasta: t.hasta != null && t.hasta !== "" ? Number(t.hasta) : null,
          tipo_beneficio: t.tipo_beneficio || "descuento",
          valor: Number(t.valor) || 0,
          activacion: t.activacion || "al_cierre",
          descripcion: t.descripcion || null,
        }));
      await saveAdminLotPricing(detail.id, clean, pricingMeta !== "" ? Number(pricingMeta) : null);
      toast.success("Rangos guardados");
      setPricingOpen(false);
      const d = await getAdminLotDetail(detail.id);
      setLotDetail(d);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Error al guardar rangos");
    } finally {
      setPricingSaving(false);
    }
  }

  const tierText = (t: any) => {
    const v = Number(t.valor || 0);
    switch (t.tipo_beneficio) {
      case "precio": return `Precio S/ ${v.toFixed(2)}`;
      case "descuento": return `Descuento ${v}%`;
      case "flete": return v > 0 ? `Flete S/ ${v.toFixed(2)}` : "Flete gratis";
      case "unidades_extra": return `+${v} unidades`;
      case "destaque": return "Compra destacada";
      case "cashback": return `Cashback ${v}%`;
      default: return t.descripcion || "Beneficio especial";
    }
  };

  const activationLabel = (a: string) =>
    a === "al_cmc" ? "Al alcanzar CMC" : a === "al_cierre" ? "Al cerrar lote" : "Al superar expectativa";

  const filtered = items.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const fmtMoney = (v: number | null | undefined) => v != null ? `S/ ${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—";

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Layers className="w-5 h-5" /></span>
            Lotes
          </h1>
          <span className="text-sm text-gray-400">{totalItems} lote{totalItems !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título o SKU..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200">
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button onClick={() => { setSortOrder(o => o === "DESC" ? "ASC" : "DESC"); setPage(1); }}
            className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors">
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === "DESC" ? "Más reciente" : "Más antiguo"}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No se encontraron lotes</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Producto</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Estado</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Lote</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Precio lote</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Precio unit.</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Unidades</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Vendedor</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => {
                  const total = Number(p.cantidad_total || 0);
                  const reserved = Number(p.cantidad_reservada || 0);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-semibold text-gray-900 text-sm">{p.title}</span>
                        {p.destacado && (
                          <span className="ml-2 text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">Destacado</span>
                        )}
                        {p.lot_estado === "abierto" && (
                          <span className="ml-2 text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">En convocatoria</span>
                        )}
                        {p.sku && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{p.sku}</p>}
                      </td>
                      <td className="px-3 py-3 text-center hidden sm:table-cell">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[p.status] || "bg-gray-100 text-gray-600"}`}>
                          {statusLabel[p.status] || p.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center hidden sm:table-cell">
                        {p.lot_estado ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${lotStatusColor[p.lot_estado] || "bg-gray-100 text-gray-600"}`}>
                            {lotStatusLabel[p.lot_estado] || p.lot_estado}
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-sm text-gray-700 font-medium">{fmtMoney(p.precio_lote)}</td>
                      <td className="px-3 py-3 hidden lg:table-cell text-sm text-gray-500">{fmtMoney(p.precio_individual)}</td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-sm text-gray-700 font-medium">{reserved} / {total || "—"}</span>
                          <span className="flex items-center text-[10px] text-gray-400" title="Participantes">
                            <Users className="w-3 h-3 mr-0.5" />{p.participantes_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-500">{userMap[p.user_id] || "—"}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openDetail(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalles">
                            <Eye className="h-4 w-4" />
                          </button>
                          {p.status !== "active" && (
                            <button onClick={() => handleApprove(p.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Aprobar">
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {p.status !== "rejected" && (
                            <button onClick={() => handleReject(p.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Rechazar">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => setDeleteConfirm(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-700 hover:bg-red-50 transition-colors" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-400">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Anterior
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Siguiente
              </button>
            </div>
          </div>
        )}

        {detail && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 text-base truncate pr-2">{detail.title}</h2>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={openPricing}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg px-3 py-1.5 transition-colors">
                    Editar RCG
                  </button>
                  <button onClick={() => setDetail(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-5 text-sm">

                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Datos del lote</h3>
                  <div className="space-y-1.5">
                    <div className="flex gap-2"><span className="text-gray-400 w-32 flex-shrink-0">Precio por lote</span><span className="text-gray-700 font-medium">{fmtMoney(detail.precio_lote)}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-32 flex-shrink-0">Precio individual</span><span className="text-gray-700 font-medium">{fmtMoney(detail.precio_individual)}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-32 flex-shrink-0">Cantidad total</span><span className="text-gray-700 font-medium">{detail.cantidad_total ?? "—"}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-32 flex-shrink-0">Reservadas</span><span className="text-gray-700 font-medium">{detail.cantidad_reservada ?? 0}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-32 flex-shrink-0">Mínimo para cerrar</span><span className="text-gray-700 font-medium">{detail.participantes_minimos ?? "—"}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-32 flex-shrink-0">CMC por comprador</span><span className="text-gray-700 font-medium">{detail.cmc ?? "—"}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-32 flex-shrink-0">Participantes</span><span className="text-gray-700 font-medium">{detail.participantes_count ?? 0}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-32 flex-shrink-0">Cierre</span><span className="text-gray-700 font-medium">{detail.cierre_estimado ? new Date(detail.cierre_estimado).toLocaleString("es-PE") : "—"}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-32 flex-shrink-0">Estado lote</span>
                      <span className={`font-semibold ${detail.lot_estado === "abierto" ? "text-green-600" : detail.lot_estado === "cerrado" ? "text-blue-600" : detail.lot_estado === "cancelado" ? "text-red-500" : detail.lot_estado === "pendiente" ? "text-yellow-500" : "text-gray-500"}`}>
                        {lotStatusLabel[detail.lot_estado || ""] || detail.lot_estado || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Condiciones de venta</h3>
                  <div className="space-y-1.5">
                    <div className="flex gap-2"><span className="text-gray-400 w-32 flex-shrink-0">Método de pago</span><span className="text-gray-700">Venta por lote</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-32 flex-shrink-0">Envío</span><span className="text-gray-700">—</span></div>
                  </div>
                </div>

                {lotDetail && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rangos RCG</h3>
                    {lotDetail.tiers.length === 0 ? (
                      <p className="text-xs text-gray-400">No hay rangos configurados.</p>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-gray-100">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-400">
                            <tr>
                              <th className="px-2.5 py-1.5">Rango</th>
                              <th className="px-2.5 py-1.5">Beneficio</th>
                              <th className="px-2.5 py-1.5">Activación</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-xs">
                            {lotDetail.tiers.map((t: any) => (
                              <tr key={t.id}>
                                <td className="px-2.5 py-1.5 font-semibold text-gray-700">{t.desde}{t.hasta ? ` – ${t.hasta}` : "+"}</td>
                                <td className="px-2.5 py-1.5 text-gray-700">{tierText(t)}</td>
                                <td className="px-2.5 py-1.5 text-gray-500">{activationLabel(t.activacion)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {lotDetail.benefits.length > 0 && (
                      <div className="mt-3">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Beneficios aplicados</h3>
                        <div className="space-y-1.5">
                          {lotDetail.benefits.map((b: any) => (
                            <div key={b.id} className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2">
                              <div>
                                <p className="text-xs font-medium text-gray-700">{b.beneficio_aplicado}</p>
                                <p className="text-[10px] text-gray-400">
                                  {b.comprador_first_name ? `${b.comprador_first_name} ${b.comprador_last_name || ""}`.trim() : "—"}
                                  {" · "}{new Date(b.applied_at).toLocaleString("es-PE")}
                                </p>
                              </div>
                              {b.unidades_extra > 0 && (
                                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+{b.unidades_extra} unid.</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100 space-y-1">
                  {detail.sku && <div className="flex gap-2 text-xs"><span className="text-gray-400 w-32 flex-shrink-0">SKU</span><span className="text-gray-700 font-mono text-xs">{detail.sku}</span></div>}
                  <div className="flex gap-2 text-xs"><span className="text-gray-400 w-32 flex-shrink-0">Stock</span><span className="text-gray-700 font-medium">{detail.stock}</span></div>
                  <div className="flex gap-2 text-xs"><span className="text-gray-400 w-32 flex-shrink-0">Estado</span><span className={`font-semibold capitalize ${detail.status === "active" ? "text-green-600" : detail.status === "rejected" ? "text-red-500" : "text-yellow-500"}`}>{detail.status.replace(/_/g, " ")}</span></div>
                  <div className="flex gap-2 text-xs"><span className="text-gray-400 w-32 flex-shrink-0">Vendedor</span><span className="text-gray-700 font-medium">{userMap[detail.user_id] || detail.user_id}</span></div>
                  <div className="flex gap-2 text-xs"><span className="text-gray-400 w-32 flex-shrink-0">Categoría</span><span className="text-gray-700 font-medium">{categoryMap[detail.category_id] || detail.category_id}</span></div>
                  <div className="flex gap-2 text-xs"><span className="text-gray-400 w-32 flex-shrink-0">Creado</span><span className="text-gray-500">{new Date(detail.created_at).toLocaleString("es-PE")}</span></div>
                </div>

              </div>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar lote</h3>
              <p className="text-sm text-gray-600 mb-6">
                ¿Estás seguro de eliminar el lote <strong>{deleteConfirm.title}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button onClick={() => handleDelete(deleteConfirm.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {pricingOpen && detail && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-base">Editar rangos RCG</h3>
                <button onClick={() => setPricingOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <p className="text-xs text-gray-400">
                  Rango sobre las unidades comprometidas en total. Cada rango activa un beneficio al alcanzarse.
                </p>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-500 w-40 flex-shrink-0">Meta de venta (expectativa)</label>
                  <input type="number" value={pricingMeta} onChange={e => setPricingMeta(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                    placeholder="Por defecto: cantidad total" />
                </div>

                <div className="space-y-3">
                  {pricingTiers.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">Sin rangos configurados.</p>
                  )}
                  {pricingTiers.map((t, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rango {idx + 1}</span>
                        <button type="button" onClick={() => setPricingTiers(prev => prev.filter((_, i) => i !== idx))}
                          className="text-xs text-red-500 hover:text-red-700 font-medium">Quitar</button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="form-label">Desde</label>
                          <input type="number" value={t.desde} onChange={e => setPricingTiers(prev => prev.map((x, i) => i === idx ? { ...x, desde: Number(e.target.value) } : x))}
                            className="w-full form-input-custom focus:ring-purple-500" placeholder="1" />
                        </div>
                        <div>
                          <label className="form-label">Hasta</label>
                          <input type="number" value={t.hasta ?? ""} onChange={e => setPricingTiers(prev => prev.map((x, i) => i === idx ? { ...x, hasta: e.target.value !== "" ? Number(e.target.value) : null } : x))}
                            className="w-full form-input-custom focus:ring-purple-500" placeholder="Sin límite" />
                        </div>
                        <div className="col-span-2">
                          <label className="form-label">Activación</label>
                          <select value={t.activacion} onChange={e => setPricingTiers(prev => prev.map((x, i) => i === idx ? { ...x, activacion: e.target.value } : x))}
                            className="w-full form-input-custom focus:ring-purple-500">
                            <option value="al_cmc">Al alcanzar CMC (por comprador)</option>
                            <option value="al_cierre">Al cerrar lote</option>
                            <option value="superar_expectativa">Al superar expectativa</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label">Beneficio</label>
                          <select value={t.tipo_beneficio} onChange={e => setPricingTiers(prev => prev.map((x, i) => i === idx ? { ...x, tipo_beneficio: e.target.value } : x))}
                            className="w-full form-input-custom focus:ring-purple-500">
                            <option value="precio">Precio (S/)</option>
                            <option value="descuento">Descuento (%)</option>
                            <option value="flete">Flete (S/)</option>
                            <option value="unidades_extra">Unidades extra</option>
                            <option value="destaque">Destacar compra</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label">Valor</label>
                          <input type="number" step="0.01" value={t.valor} onChange={e => setPricingTiers(prev => prev.map((x, i) => i === idx ? { ...x, valor: Number(e.target.value) } : x))}
                            className="w-full form-input-custom focus:ring-purple-500" placeholder="0" />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Descripción para el comprador</label>
                        <input type="text" value={t.descripcion || ""} onChange={e => setPricingTiers(prev => prev.map((x, i) => i === idx ? { ...x, descripcion: e.target.value } : x))}
                          className="w-full form-input-custom focus:ring-purple-500" placeholder="Ej: Descuento del 5% por unidad" />
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setPricingTiers(prev => [...prev, {
                  desde: prev.length > 0 ? Math.max(1, prev[prev.length - 1].desde) + 1 : 1,
                  hasta: null,
                  tipo_beneficio: "descuento",
                  valor: 5,
                  activacion: "al_cierre",
                  descripcion: "",
                }])}
                  className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                  + Agregar rango
                </button>

                <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
                  <button onClick={() => setPricingOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button onClick={savePricing} disabled={pricingSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-60">
                    {pricingSaving ? "Guardando..." : "Guardar rangos"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .form-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #4b5563;
          margin-bottom: 0.375rem;
          display: block;
        }
        .form-input-custom {
          font-size: 0.875rem;
          color: #374151;
          border-color: #d1d5db;
          border-radius: 0.5rem;
          border-width: 1px;
          padding: 0.5rem 0.75rem;
        }
      `}</style>
    </AdminLayout>
  );
}
