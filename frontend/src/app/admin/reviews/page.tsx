"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminReviews, adminDeleteReview, getImageUrl } from "@/lib/api";
import type { Review } from "@/lib/api";
import { toast } from "sonner";
import { Star, Search, Trash2, Loader2, Package } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, [page]);

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminReviews(page, 20);
      setReviews(data.data);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch {
      toast.error("Error al cargar reseñas");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta reseña?")) return;
    try {
      await adminDeleteReview(id);
      toast.success("Reseña eliminada");
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch {
      toast.error("Error al eliminar");
    }
  }

  const filtered = reviews.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.product_title?.toLowerCase().includes(q) || r.comment?.toLowerCase().includes(q) || r.user_email?.toLowerCase().includes(q) || r.user_first_name?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reseñas</h1>
          <span className="text-sm text-gray-400">{totalItems} reseña{totalItems !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por producto, usuario..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No se encontraron reseñas</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Producto</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Comprador</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rating</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Comentario</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-600">{new Date(r.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric" })}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <p className="text-xs font-medium text-gray-700 truncate max-w-[200px]">{r.product_title || "—"}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium text-gray-700">{r.user_first_name ? `${r.user_first_name} ${r.user_last_name}` : r.user_email || "—"}</p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <p className="text-xs text-gray-600 truncate max-w-[250px]">{r.comment || "—"}</p>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
      </div>
    </AdminLayout>
  );
}
