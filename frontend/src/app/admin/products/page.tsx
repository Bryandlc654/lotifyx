"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminProducts, approveProduct, rejectProduct, getImageUrl, getAdminUsers, getCategories, Product } from "@/lib/api";
import { Check, X, Eye, Search, Calendar, XCircle } from "lucide-react";
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

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("draft,pending_approval");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Product | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => { load(); }, [statusFilter]);

  useEffect(() => {
    getAdminUsers({ limit: 9999 }).then(res => {
      const map: Record<string, string> = {};
      res.data.forEach(u => {
        const name = u.profile ? [u.profile.first_name, u.profile.last_name].filter(Boolean).join(" ").trim() : "";
        map[u.id] = name || u.email;
      });
      setUserMap(map);
    }).catch(() => {});
    getCategories().then(cats => {
      const map: Record<string, string> = {};
      cats.forEach(c => { map[c.id] = c.name; });
      setCategoryMap(map);
      setCategories(cats.map(c => ({ id: c.id, name: c.name })));
    }).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const status = statusFilter === "all" ? "" : statusFilter;
      setItems(await getAdminProducts(status || undefined));
    } catch {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveProduct(id);
      toast.success("Producto aprobado");
      setItems(prev => prev.map(p => p.id === id ? { ...p, status: "active" } : p));
    } catch {
      toast.error("Error al aprobar");
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectProduct(id);
      toast.success("Producto rechazado");
      setItems(prev => prev.map(p => p.id === id ? { ...p, status: "rejected" } : p));
    } catch {
      toast.error("Error al rechazar");
    }
  }

  const filtered = items.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <span className="text-sm text-gray-400">{filtered.length} producto{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título o SKU..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200">
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 max-w-[200px]">
            <option value="all">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No se encontraron productos</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Producto</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Vendedor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">{p.title}</span>
                        {p.stock != null && (
                          <span className={`ml-2 text-[10px] font-medium ${p.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                            Stock: {p.stock}
                          </span>
                        )}
                      </div>
                      {p.sku && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{p.sku}</p>}
                    </td>
                    <td className="px-3 py-3 text-center hidden sm:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[p.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabel[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{categoryMap[p.category_id] || "—"}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{userMap[p.user_id] || "—"}</span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(p.created_at).toLocaleDateString("es-PE")}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setDetail(p)}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {detail && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 text-base truncate pr-2">{detail.title}</h2>
                <button onClick={() => setDetail(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-5 text-sm">

                {Object.keys(detail.specifications || {}).length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Especificaciones</h3>
                    <div className="space-y-1.5">
                      {Object.entries(detail.specifications).map(([k, v]) => {
                        const val = String(v ?? "");
                        const isImage = val.startsWith("/uploads/") && /\.(jpg|jpeg|png|gif|webp)$/i.test(val);
                        const isGallery = val.startsWith("[");
                        return (
                          <div key={k} className="flex gap-2">
                            <span className="text-gray-400 w-28 flex-shrink-0 capitalize">{k.replace(/_/g, " ")}</span>
                            <span className="text-gray-700 flex-1">
                              {isImage ? (
                                <img src={getImageUrl(val)} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                              ) : isGallery ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {JSON.parse(val).map((u: string, i: number) => (
                                    <img key={i} src={getImageUrl(u)} alt={`${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                                  ))}
                                </div>
                              ) : (
                                val || "-"
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Condiciones de venta</h3>
                  <div className="space-y-1.5">
                    <div className="flex gap-2"><span className="text-gray-400 w-28 flex-shrink-0">Método de pago</span><span className="text-gray-700">{detail.metodo_pago || "-"}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-28 flex-shrink-0">Envío</span><span className="text-gray-700">{[detail.envio_delivery && "Delivery propio", detail.envio_courier && "Courier externo"].filter(Boolean).join(", ") || "-"}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-28 flex-shrink-0">Costo envío</span><span className="text-gray-700">S/ {Number(detail.costo_envio).toFixed(2)}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-28 flex-shrink-0">Tiempo entrega</span><span className="text-gray-700">{detail.tiempo_entrega || "-"}</span></div>
                    {detail.cambios && <div className="flex gap-2"><span className="text-gray-400 w-28 flex-shrink-0">Cambios</span><span className="text-gray-700">{detail.cambios}</span></div>}
                    {detail.devoluciones && <div className="flex gap-2"><span className="text-gray-400 w-28 flex-shrink-0">Devoluciones</span><span className="text-gray-700">{detail.devoluciones}</span></div>}
                    {detail.garantia && <div className="flex gap-2"><span className="text-gray-400 w-28 flex-shrink-0">Garantía</span><span className="text-gray-700">{detail.garantia}</span></div>}
                    {detail.politicas_imagenes && <div className="flex gap-2"><span className="text-gray-400 w-28 flex-shrink-0">Políticas</span><span className="text-gray-700">{detail.politicas_imagenes}</span></div>}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-1">
                  {detail.sku && <div className="flex gap-2 text-xs"><span className="text-gray-400 w-28 flex-shrink-0">SKU</span><span className="text-gray-700 font-mono text-xs">{detail.sku}</span></div>}
                  {detail.stock != null && <div className="flex gap-2 text-xs"><span className="text-gray-400 w-28 flex-shrink-0">Stock</span><span className="text-gray-700 font-medium">{detail.stock}</span></div>}
                  <div className="flex gap-2 text-xs"><span className="text-gray-400 w-28 flex-shrink-0">Estado</span><span className={`font-semibold capitalize ${detail.status === "active" ? "text-green-600" : detail.status === "rejected" ? "text-red-500" : "text-yellow-500"}`}>{detail.status.replace(/_/g, " ")}</span></div>
                  <div className="flex gap-2 text-xs"><span className="text-gray-400 w-28 flex-shrink-0">Vendedor</span><span className="text-gray-700 font-medium">{userMap[detail.user_id] || detail.user_id}</span></div>
                  <div className="flex gap-2 text-xs"><span className="text-gray-400 w-28 flex-shrink-0">Categoría</span><span className="text-gray-700 font-medium">{categoryMap[detail.category_id] || detail.category_id}</span></div>
                  <div className="flex gap-2 text-xs"><span className="text-gray-400 w-28 flex-shrink-0">Creado</span><span className="text-gray-500">{new Date(detail.created_at).toLocaleString("es-PE")}</span></div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
