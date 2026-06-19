"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getMyProducts, getProfile, isAuthenticated, removeTokens, deleteProduct, getImageUrl, Product } from "@/lib/api";
import { Package, ChevronRight, Pencil, Trash2, Eye, X, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function MisProductosPage() {
  const [userRole, setUserRole] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();

  const filtered = products.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
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
      <main className="min-h-screen bg-gray-50 px-4 md:px-8 pt-24 md:pt-40 pb-8 flex items-start justify-center gap-32">
        <nav className="w-44 flex-shrink-0 pt-8 space-y-1">
          <button onClick={() => router.push("/perfil")}
            className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
            Editar Perfil
          </button>
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-compras")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Compras
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-cuentas")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Cuentas
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-ventas")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Ventas
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-productos")}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 border-l-2 border-slate-700 -ml-px">
              Mis Productos
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/ofrecer")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Ofrecer
            </button>
          )}
        </nav>

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
                placeholder="Buscar por título..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white" />
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
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Producto</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Tipo</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Especificaciones</th>
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
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 max-w-[260px]">
                          {p.specifications && Object.keys(p.specifications).length > 0 ? (
                            Object.entries(p.specifications).filter(([k]) => k !== "Título del Producto" && k !== "Tipo de Producto" && k !== "Imagen" && k !== "Galería").slice(0, 3).map(([k, v]) => {
                              const val = String(v ?? "");
                              if (val.startsWith("/uploads") || val.startsWith("[")) return null;
                              return (
                                <span key={k}>
                                  <span className="font-medium capitalize">{k.replace(/_/g, " ")}:</span> {val.length > 20 ? val.slice(0, 20) + "..." : val}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                        }`}>{p.status}</span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell text-sm text-gray-400">{new Date(p.created_at).toLocaleDateString("es-PE")}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setDetailProduct(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalle">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => router.push(`/perfil/ofrecer/detalles?categoria=${p.category_id}&nombre=${encodeURIComponent(p.title)}&id=${p.id}`)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
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
                    detailProduct.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                  }`}>{detailProduct.status}</span>
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
    </>
  );
}
