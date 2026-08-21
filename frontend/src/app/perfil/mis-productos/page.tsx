"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getMyProducts, getProfile, isAuthenticated, removeTokens, deleteProduct, toggleProductPause, getImageUrl, getAuctionByProduct, reopenAuction, getInterests, Product } from "@/lib/api";
import { Package, ChevronRight, Pencil, Trash2, Eye, X, Search, AlertTriangle, MessageCircle, Wallet, RefreshCw, Pause, Play, Users } from "lucide-react";
import { toast } from "sonner";
import { PerfilSidebar } from "@/components/layout/perfil-sidebar";

export default function MisProductosPage() {
  const [userRole, setUserRole] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [reopenTarget, setReopenTarget] = useState<{ productId: string; auctionId: string } | null>(null);
  const [reopenDate, setReopenDate] = useState("");
  const [interestsProduct, setInterestsProduct] = useState<Product | null>(null);
  const [interests, setInterests] = useState<any[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();

  const filtered = products.filter(p => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statuses = Array.from(new Set(products.map(p => p.status)));

  function loadProducts() {
    getMyProducts()
      .then(setProducts)
      .catch(() => toast.error("Error al cargar productos"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then((data) => {
        const u = data.user as any;
        setUserRole(u.role?.name || "");
      })
      .catch(() => { removeTokens(); router.push("/"); });
    loadProducts();
  }, [router]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      toast.success("Producto eliminado");
      setDeleteTarget(null);
      loadProducts();
    } catch { toast.error("Error al eliminar"); }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 md:px-8 pt-24 md:pt-40 pb-8 flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-12">
        <PerfilSidebar active="mis-productos" userRole={userRole} />

        <div className="max-w-4xl w-full">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">Inicio</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <button onClick={() => router.push("/perfil")} className="text-gray-400 hover:text-gray-600">Perfil</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-[#8234FE] font-semibold">Mis Productos</span>
          </nav>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Productos</h1>
              <p className="text-gray-500 text-sm mt-1">{filtered.length} de {products.length} producto{products.length !== 1 ? "s" : ""}</p>
            </div>
            {userRole === "vendedor" && (
              <button onClick={() => router.push("/perfil/ofrecer")}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-2 px-5 rounded-xl text-sm shadow-md hover:opacity-90 transition-opacity">
                + Nuevo Producto
              </button>
            )}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por título o SKU..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200">
              <option value="all">Todos los estados</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Aún no tienes productos</h2>
              <p className="text-sm text-gray-400 mb-6">Publica tu primer producto para empezar a vender</p>
              {userRole === "vendedor" && (
                <button onClick={() => router.push("/perfil/ofrecer")}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-2.5 px-6 rounded-xl text-sm shadow-md hover:opacity-90 transition-opacity">
                  Publicar Producto
                </button>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No se encontraron productos con ese filtro</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">SKU</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Stock</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Producto</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Tipo</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Estado</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Fecha</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className="text-xs font-mono text-gray-400">{p.sku || "—"}</span>
                      </td>
                      <td className="px-3 py-4 text-center hidden md:table-cell">
                        <span className={`text-xs font-medium ${(p.stock ?? 0) > 0 ? "text-green-700" : "text-red-500"}`}>
                          {p.stock ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-900 text-sm">{p.specifications?.["Título del Producto"] || p.specifications?.titulo || p.specifications?.title || p.title}</span>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="text-sm text-gray-500">{p.specifications?.["Tipo de Producto"] || {
                          "plataforma": "Venta Directa",
                          "subasta": "Subasta",
                          "venta_por_lote": "Venta por Lote"
                        }[p.metodo_pago] || p.metodo_pago || "—"}</span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.metodo_pago === "subasta" && p.auction_estado === "cerrado" ? "bg-red-50 text-red-500"
                          : p.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                        }`}>
                          {p.metodo_pago === "subasta" && p.auction_estado === "cerrado" ? "cerrado" : p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell text-sm text-gray-400">{new Date(p.created_at).toLocaleDateString("es-PE")}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setDetailProduct(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalle">
                            <Eye className="h-4 w-4" />
                          </button>
                          {p.tipo_inmobiliario && (
                            <button onClick={async () => {
                              setInterestsProduct(p); setInterests([]); setLoadingInterests(true);
                              try { setInterests(await getInterests(p.id) || []); } catch { toast.error("Error al cargar intereses"); }
                              finally { setLoadingInterests(false); }
                            }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Ver intereses registrados">
                              <Users className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => router.push(`/perfil/ofrecer/detalles?categoria=${p.category_id}&nombre=${encodeURIComponent(p.title)}&id=${p.id}`)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={async () => {
                            try {
                              await toggleProductPause(p.id);
                              toast.success(p.status === "paused" ? "Publicación reanudada" : "Publicación pausada");
                              const data = await getMyProducts();
                              setProducts(data || []);
                            } catch (e: any) {
                              toast.error(e.message || "Error al cambiar estado");
                            }
                          }}
                            className={`p-1.5 rounded-lg transition-colors ${p.status === "paused" ? "text-green-600 hover:bg-green-50" : "text-amber-500 hover:bg-amber-50"}`}
                            title={p.status === "paused" ? "Reanudar publicación" : "Pausar publicación"}>
                            {p.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          </button>
                          <button onClick={() => setDeleteTarget(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {p.metodo_pago === "subasta" && (
                            <button onClick={async () => {
                              try {
                                const auction = await getAuctionByProduct(p.id);
                                if (!auction) { toast.error("No hay subasta asociada"); return; }
                                if (auction.estado !== "cerrado" || auction.ganador_id) {
                                  toast.error("La subasta está activa o tuvo ganador"); return;
                                }
                                setReopenTarget({ productId: p.id, auctionId: auction.id });
                                setReopenDate("");
                              } catch { toast.error("Error al cargar"); }
                            }} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Reabrir subasta">
                              <RefreshCw className="h-4 w-4" />
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
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
            <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Eliminar producto</h3>
            <p className="text-sm text-gray-500 mb-6">¿Estás seguro de eliminar <strong>{deleteTarget.title}</strong>? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {reopenTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setReopenTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
            <RefreshCw className="h-10 w-10 text-purple-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reabrir subasta</h3>
            <p className="text-sm text-gray-500 mb-6">Ingresa la nueva fecha de cierre para la subasta.</p>
            <input type="datetime-local" value={reopenDate} onChange={(e) => setReopenDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm mb-4 focus:ring-2 focus:ring-purple-200 focus:border-purple-500" />
            <div className="flex gap-3 justify-center">
              <button onClick={() => setReopenTarget(null)}
                className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={async () => {
                if (!reopenDate) { toast.error("Selecciona una fecha"); return; }
                try {
                  await reopenAuction(reopenTarget.auctionId, new Date(reopenDate).toISOString());
                  toast.success("Subasta reabierta");
                  setReopenTarget(null);
                } catch { toast.error("Error al reabrir"); }
              }} className="px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors">
                Reabrir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setDetailProduct(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 truncate pr-4">{detailProduct.specifications?.["Título del Producto"] || detailProduct.title}</h2>
              <button onClick={() => setDetailProduct(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-5 text-sm">
              <div className="flex items-center gap-4">
                {detailProduct.sku && (
                  <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">SKU: {detailProduct.sku}</span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">Estado:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    detailProduct.metodo_pago === "subasta" && detailProduct.auction_estado === "cerrado" ? "bg-red-50 text-red-500"
                    : detailProduct.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                  }`}>{detailProduct.metodo_pago === "subasta" && detailProduct.auction_estado === "cerrado" ? "cerrado" : detailProduct.status}</span>
                </div>
              </div>

              {/* Specifications */}
              {Object.keys(detailProduct.specifications || {}).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Especificaciones</h3>
                  <div className="space-y-1.5">
                    {Object.entries(detailProduct.specifications).map(([k, v]) => {
                      const val = String(v ?? "");
                      const isImage = val.startsWith("/uploads/") && (val.match(/\.(jpg|jpeg|png|gif|webp)$/i));
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

              {/* Conditions */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Condiciones de venta</h3>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-28 flex-shrink-0">Método de pago</span>
                    <span className="text-gray-700">{detailProduct.metodo_pago || "-"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-28 flex-shrink-0">Envío</span>
                    <span className="text-gray-700">
                      {[detailProduct.envio_delivery && "Delivery propio", detailProduct.envio_courier && "Courier externo"].filter(Boolean).join(", ") || "-"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-28 flex-shrink-0">Costo envío</span>
                    <span className="text-gray-700">S/ {Number(detailProduct.costo_envio).toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-28 flex-shrink-0">Tiempo entrega</span>
                    <span className="text-gray-700">{detailProduct.tiempo_entrega || "-"}</span>
                  </div>
                  {detailProduct.cambios && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-28 flex-shrink-0">Cambios</span>
                      <span className="text-gray-700">{detailProduct.cambios}</span>
                    </div>
                  )}
                  {detailProduct.devoluciones && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-28 flex-shrink-0">Devoluciones</span>
                      <span className="text-gray-700">{detailProduct.devoluciones}</span>
                    </div>
                  )}
                  {detailProduct.garantia && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-28 flex-shrink-0">Garantía</span>
                      <span className="text-gray-700">{detailProduct.garantia}</span>
                    </div>
                  )}
                  {detailProduct.politicas_imagenes && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-28 flex-shrink-0">Políticas</span>
                      <span className="text-gray-700">{detailProduct.politicas_imagenes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-400 pt-2 border-t border-gray-50">
                Creado: {new Date(detailProduct.created_at).toLocaleString("es-PE")}
              </div>
            </div>
          </div>
        </div>
      )}

      {interestsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setInterestsProduct(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Intereses registrados</h3>
              <button onClick={() => setInterestsProduct(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4">{interestsProduct.title}</p>
            {loadingInterests ? (
              <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
            ) : interests.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aún no hay intereses registrados para este inmueble.</p>
            ) : (
              <div className="space-y-3">
                {interests.map((i) => (
                  <div key={i.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">{i.first_name || ""} {i.last_name || ""} {(!i.first_name && !i.last_name) ? "Interesado" : ""}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 capitalize">{i.tipo_operacion || "interés"}</span>
                    </div>
                    {Number(i.monto_separo) > 0 && (
                      <p className="text-xs text-gray-700 mt-1">Separo/garantía ofrecida: <strong>S/ {Number(i.monto_separo).toFixed(2)}</strong></p>
                    )}
                    {i.mensaje && <p className="text-xs text-gray-500 mt-1 italic">"{i.mensaje}"</p>}
                    <p className="text-[10px] text-gray-400 mt-1.5">{i.user_email || ""} {i.user_phone ? `· ${i.user_phone}` : ""} · {new Date(i.created_at).toLocaleDateString("es-PE")}</p>
                  </div>
                ))}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                  <p className="text-[11px] text-amber-800 leading-relaxed"><strong>Recuerda:</strong> el separo o garantía no equivale a la transferencia de propiedad ni sustituye los actos notariales o registrales.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

