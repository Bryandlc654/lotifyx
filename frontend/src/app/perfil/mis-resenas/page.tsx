"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getMyReviews, isAuthenticated, removeTokens, getProfile, getImageUrl } from "@/lib/api";
import type { Review } from "@/lib/api";
import { Star, ChevronRight, MessageSquareText, Package } from "lucide-react";

export default function MisResenasPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then((data) => setUserRole(((data as any).user as any)?.role?.name || ""))
      .catch(() => { removeTokens(); router.push("/"); });
    getMyReviews()
      .then(setReviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 md:px-8 pt-24 md:pt-40 pb-8 flex items-start justify-center gap-32">
        <nav className="w-44 flex-shrink-0 pt-8 space-y-1">
          <button onClick={() => router.push("/perfil")}
            className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
            Editar Perfil
          </button>
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/dashboard")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Dashboard
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-compras")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Compras
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mensajes")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mensajes
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
            <button onClick={() => router.push("/perfil/mis-fondos")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Fondos
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/carga-masiva")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Carga Masiva
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-productos")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Productos
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/ofrecer")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Ofrecer
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mi-plan")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mi Plan
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-resenas")}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 border-l-2 border-slate-700 -ml-px">
              Mis Reseñas
            </button>
          )}
        </nav>

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
            <p className="text-gray-500 text-sm mt-1">{reviews.length} reseña{reviews.length !== 1 ? "s" : ""}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <MessageSquareText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">No tienes reseñas aún</h3>
              <p className="text-sm text-gray-500 mb-6">Cuando compres un producto y sea entregado, podrás dejar tu reseña.</p>
              <button onClick={() => router.push("/perfil/mis-compras")}
                className="inline-block text-white font-semibold py-2 px-6 rounded-xl transition-opacity hover:opacity-90" style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
                Ver mis compras
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
