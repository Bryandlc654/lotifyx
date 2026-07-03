"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  isAuthenticated, removeTokens, getProfile, authFetch,
  createReview, uploadGallery, getOrderReviews, getImageUrl,
} from "@/lib/api";
import { toast } from "sonner";
import { Star, ChevronRight, X, Loader2, Package } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api";

export default function ResenaPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<Record<string, { rating: number; comment: string; images: string[] }>>({});
  const [existingReviews, setExistingReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    (async () => {
      try {
        const profile = await getProfile();
        const res = await authFetch(`${API_URL}/checkout/orders/${orderId}`);
        const data = await res.json();
        if (!res.ok) throw new Error();
        if (data.user_id !== (profile as any).user?.id) { router.push("/perfil/mis-compras"); return; }
        if (data.status !== "completed") { toast.error("Solo puedes reseñar pedidos completados"); router.push("/perfil/mis-compras"); return; }
        setOrder(data);

        // Load existing reviews
        const existing = await getOrderReviews(orderId);
        setExistingReviews(existing);
        const map: Record<string, any> = {};
        for (const item of data.items || []) {
          const found = existing.find((r: any) => r.product_id === item.product_id);
          if (found) {
            map[item.product_id] = { rating: found.rating, comment: found.comment, images: found.images || [] };
          } else {
            map[item.product_id] = { rating: 0, comment: "", images: [] };
          }
        }
        setReviews(map);
      } catch {
        router.push("/perfil/mis-compras");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, router]);

  function setRating(productId: string, rating: number) {
    setReviews(prev => ({ ...prev, [productId]: { ...prev[productId], rating } }));
  }

  function setComment(productId: string, comment: string) {
    setReviews(prev => ({ ...prev, [productId]: { ...prev[productId], comment } }));
  }

  async function handleImageUpload(productId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    try {
      const urls = await uploadGallery(files);
      setReviews(prev => ({
        ...prev,
        [productId]: { ...prev[productId], images: [...(prev[productId]?.images || []), ...urls] },
      }));
      toast.success("Imágenes subidas");
    } catch {
      toast.error("Error al subir imágenes");
    }
  }

  function removeImage(productId: string, idx: number) {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], images: prev[productId].images.filter((_, i) => i !== idx) },
    }));
  }

  async function handleSubmit(productId: string) {
    const review = reviews[productId];
    if (!review || review.rating === 0) {
      toast.error("Selecciona una calificación con estrellas");
      return;
    }
    setSubmitting(true);
    try {
      await createReview({
        product_id: productId,
        order_id: orderId,
        rating: review.rating,
        comment: review.comment,
        images: review.images,
      });
      toast.success("Reseña guardada");
      const existing = await getOrderReviews(orderId);
      setExistingReviews(existing);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar reseña");
    } finally {
      setSubmitting(false);
    }
  }

  function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} type="button" onClick={() => onChange(i)} className="transition-colors">
            <Star className={`h-7 w-7 ${i <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
          </button>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <><Header /><main className="pt-32 min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></main><Footer /></>
    );
  }

  if (!order) return null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 py-32">
        <div className="max-w-2xl mx-auto">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">Inicio</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <button onClick={() => router.push("/perfil")} className="text-gray-400 hover:text-gray-600">Perfil</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <button onClick={() => router.push("/perfil/mis-compras")} className="text-gray-400 hover:text-gray-600">Mis Compras</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-purple-600 font-semibold">Reseña</span>
          </nav>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">Deja tu reseña</h1>
          <p className="text-sm text-gray-500 mb-8">Califica los productos de tu pedido #{order.operation_number?.slice(-6) || orderId.slice(0, 8)}</p>

          <div className="space-y-6">
            {(order.items || []).map((item: any) => {
              const review = reviews[item.product_id] || { rating: 0, comment: "", images: [] };
              const existing = existingReviews.find((r: any) => r.product_id === item.product_id);
              return (
                <div key={item.product_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                      <Package className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.product_title || "Producto"}</h3>
                      <p className="text-sm text-gray-400">S/ {Number(item.price).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Calificación</p>
                      <StarSelector value={review.rating} onChange={(v) => setRating(item.product_id, v)} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Comentario</p>
                      <textarea
                        value={review.comment}
                        onChange={(e) => setComment(item.product_id, e.target.value)}
                        placeholder="Comparte tu experiencia con este producto..."
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-purple-300"
                        rows={3}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Fotos</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {review.images.map((url, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                            <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => removeImage(item.product_id, i)}
                              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {review.images.length < 5 && (
                          <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 cursor-pointer hover:border-purple-300 transition-colors">
                            <span className="text-2xl">+</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(item.product_id, e)} />
                          </label>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">Máx. 5 fotos</p>
                    </div>

                    <div className="pt-2">
                      {existing ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                          <span>✓ Reseña guardada</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSubmit(item.product_id)}
                          disabled={submitting}
                          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                        >
                          {submitting ? "Guardando..." : "Enviar reseña"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
