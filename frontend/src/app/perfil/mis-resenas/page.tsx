"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getMyReviews, getSellerReviews, isAuthenticated, removeTokens, getProfile, getImageUrl } from "@/lib/api";
import type { Review } from "@/lib/api";
import { Star, ChevronRight, MessageSquareText, Package } from "lucide-react";
import { PerfilSidebar } from "@/components/layout/perfil-sidebar";

export default function MisResenasPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then((data) => {
        const role = ((data as any).user as any)?.role?.name || "";
        setUserRole(role);
        // Vendedor: historial reputacional (reseñas recibidas); Comprador: reseñas emitidas
        const loadFn = role === "vendedor" ? getSellerReviews : getMyReviews;
        loadFn()
          .then(setReviews)
          .catch(() => {})
          .finally(() => setLoading(false));
      })
      .catch(() => { removeTokens(); router.push("/"); });
  }, [router]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 md:px-8 pt-24 md:pt-40 pb-8 flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-12">
        <PerfilSidebar active="mis-resenas" userRole={userRole} />

        <div className="max-w-4xl w-full">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">Inicio</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <button onClick={() => router.push("/perfil")} className="text-gray-400 hover:text-gray-600">Perfil</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-[#8234FE] font-semibold">Mis Reseñas</span>
          </nav>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mis Reseñas</h1>
            <p className="text-gray-500 text-sm mt-1">{reviews.length} reseña{reviews.length !== 1 ? "s" : ""}{userRole === "vendedor" ? " recibidas" : ""}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <MessageSquareText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">No tienes reseñas aún</h3>
              <p className="text-sm text-gray-500 mb-6">
                {userRole === "vendedor"
                  ? "Cuando tus clientes reciban sus productos y califiquen, sus reseñas aparecerán aquí."
                  : "Cuando compres un producto y sea entregado, podrás dejar tu reseña."}
              </p>
              <button onClick={() => router.push(userRole === "vendedor" ? "/perfil/mis-ventas" : "/perfil/mis-compras")}
                className="inline-block text-white font-semibold py-2 px-6 rounded-xl transition-opacity hover:opacity-90" style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
                {userRole === "vendedor" ? "Ver mis ventas" : "Ver mis compras"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 flex-shrink-0">
                      <Package className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">{review.product_title || "Producto"}</h3>
                        <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString("es-PE")}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={`h-4 w-4 ${i <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                      {review.comment && <p className="text-sm text-gray-600 mb-2">{review.comment}</p>}
                      {userRole === "vendedor" && (review.user_first_name || review.user_last_name) && (
                        <p className="text-xs text-gray-400 mb-2">De {review.user_first_name} {review.user_last_name}</p>
                      )}
                      {review.images?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {review.images.map((url, i) => (
                            <img key={i} src={getImageUrl(url)} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                          ))}
                        </div>
                      )}
                      {review.operation_number && (
                        <p className="text-xs text-gray-400 mt-2">Pedido: #{review.operation_number.slice(-6)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
