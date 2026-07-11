"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  isAuthenticated, removeTokens, getProfile, authFetch,
  getImageUrl, createOrGetConversation, getAccessToken, getOrderReviews, getCurrentUserId,
} from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft, Check, Truck, Package, MapPin, Phone, Mail, User,
  Copy, ChevronDown, ChevronUp, Loader2, MessageCircle, Star,
} from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api";

const STEP_LABELS = ["pending", "coordination", "shipping", "delivered"];
const STEP_NAMES: Record<string, string> = {
  pending: "Exploración",
  coordination: "En coordinación de envío",
  shipping: "En envío",
  delivered: "Entregado",
};

export default function PedidoPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [shipAddress, setShipAddress] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipRef, setShipRef] = useState("");
  const [shipNotes, setShipNotes] = useState("");
  const [trackNum, setTrackNum] = useState("");
  const [trackNote, setTrackNote] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");
  const [orderReviews, setOrderReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    (async () => {
      try {
        const profileData = await getProfile();
        const u = (profileData as any).user as any;
        setProfile(u);
        const res = await authFetch(`${API_URL}/checkout/orders/${orderId}`);
        const data = await res.json();
        setOrder(data);
        setIsSeller(data.seller_id === u.id);
        setShipAddress(data.shipping_address || "");
        setShipCity(data.shipping_city || "");
        setShipRef(data.shipping_reference || "");
        setShipNotes(data.shipping_notes || "");
        setTrackNum(data.tracking_number || "");
        setEstimatedDate(data.tracking_estimated_at || "");
        if (data.status === "completed") {
          getOrderReviews(orderId).then(setOrderReviews).catch(() => {});
        }
      } catch {
        removeTokens(); router.push("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, router]);

  async function handleUpdateTracking(status: string) {
    setSaving(true);
    try {
      const res = await authFetch(`${API_URL}/checkout/orders/${orderId}/tracking`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          note: trackNote || undefined,
          shipping_address: shipAddress || undefined,
          shipping_city: shipCity || undefined,
          shipping_reference: shipRef || undefined,
          shipping_notes: shipNotes || undefined,
          tracking_number: trackNum || undefined,
          estimated_at: estimatedDate || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await authFetch(`${API_URL}/checkout/orders/${orderId}`);
      setOrder(await updated.json());
      setShowShippingForm(false);
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  async function handleContact(sellerId: string) {
    try {
      const conv = await createOrGetConversation(sellerId, order.items?.[0]?.product_id);
      router.push(`/perfil/mensajes?conv=${conv.id}`);
    } catch {
      toast.error("Error al abrir chat");
    }
  }

  function getStepIndex(status: string) {
    return STEP_LABELS.indexOf(status);
  }

  function formatDate(d: string) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("es-PE", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  function formatPrice(n: number) {
    return "S/ " + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const currentStep = getStepIndex(order?.tracking_status || "pending");
  const showStep = (idx: number) => idx <= currentStep;

  if (loading) {
    return (
      <><Header /><main className="pt-24 min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></main><Footer /></>
    );
  }

  if (!order) return null;

  const buyerName = `${order.buyer_first_name || ""} ${order.buyer_last_name || ""}`.trim();
  const sellerName = `${order.seller_first_name || ""} ${order.seller_last_name || ""}`.trim();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 mr-1">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-700">
                  Pedido #{order.operation_number?.slice(-6) || order.id.slice(0, 8)}
                </h1>
                <button onClick={() => { navigator.clipboard.writeText(order.id); toast.success("ID copiado"); }} className="text-gray-400 hover:text-gray-600">
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500">Realizado el {formatDate(order.created_at)}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 px-4 py-2 rounded-lg">
                <div className="bg-green-100 text-green-600 p-1 rounded-full">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700 leading-tight">Pago confirmado</p>
                  <p className="text-[10px] text-gray-500">Depósito confirmado</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg">
                <Package className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-xs font-bold text-gray-700 leading-tight">Método de entrega</p>
                  <p className="text-[10px] text-gray-500">Delivery</p>
                </div>
              </div>
              <div className="bg-gray-100 px-6 py-2 rounded-lg text-center">
                <p className="text-[10px] text-gray-500 font-medium">Total del pedido</p>
                <p className="text-lg font-bold text-gray-800">{formatPrice(order.total_amount)}</p>
              </div>
            </div>
          </header>

          {/* Stepper - always visible */}
          {(order.status === "paid" || order.status === "completed") && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <h2 className="text-lg font-semibold mb-8 text-gray-700">Estado del pedido</h2>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 relative">
                  <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-gray-200" />
                  <div className="absolute top-4 left-[10%]" style={{ width: `${Math.max(0, currentStep) * 33}%`, height: "2px", backgroundColor: "#8B5CF6" }} />
                  <div className="relative flex justify-between">
                    {STEP_LABELS.map((label, idx) => (
                      <div key={label} className="flex flex-col items-center w-1/4 text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 mb-2 ${showStep(idx) ? "bg-purple-500" : "bg-gray-200"}`}>
                          {idx < currentStep ? <Check className="w-4 h-4 text-white" /> : <span className={`text-xs font-bold ${showStep(idx) ? "text-white" : "text-gray-500"}`}>{idx + 1}</span>}
                        </div>
                        <p className={`text-xs font-bold ${showStep(idx) ? "text-gray-700" : "text-gray-400"}`}>{STEP_NAMES[label]}</p>
                          <p className="text-[10px] text-gray-400">
                            {label === "coordination" && order.tracking_coordination_at ? formatDate(order.tracking_coordination_at)
                              : label === "shipping" && order.tracking_shipping_at ? formatDate(order.tracking_shipping_at)
                              : label === "delivered" && order.tracking_delivered_at ? formatDate(order.tracking_delivered_at)
                              : label === "pending" ? formatDate(order.created_at)
                              : ""}
                          </p>
                          {label === "shipping" && order.tracking_estimated_at && (
                            <p className="text-[9px] text-purple-600 font-semibold mt-0.5">Est. {formatDate(order.tracking_estimated_at)}</p>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:border-l border-gray-100 lg:pl-8">
                  <h3 className="text-md font-semibold text-gray-800 leading-snug">
                    {order.tracking_status === "delivered" ? "Pedido entregado" 
                      : order.tracking_status === "shipping" ? "Pedido en camino"
                      : order.tracking_status === "coordination" ? "En coordinación de envío"
                      : "Pedido realizado"}
                  </h3>
                  {order.tracking_status === "delivered" && (
                    <p className="text-sm text-gray-400 mt-2">Esperando la confirmación. Si en 24h no responde se asumirá la recepción automáticamente</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product card */}
              <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold mb-6 text-gray-700">Producto</h2>
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex flex-col md:flex-row gap-6 mb-4 last:mb-0">
                    <div className="w-32 h-24 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center text-gray-300">
                      <Package className="w-10 h-10" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-md font-bold text-gray-800">{item.product_title || "Producto"}</h3>
                      <p className="text-xs text-gray-400 mb-4">SKU: {item.product_sku || "-"}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] text-gray-600">Cantidad: 1 unidad</span>
                      </div>
                    </div>
                    <div className="w-full md:w-48 text-right space-y-1">
                      <div className="flex justify-between md:justify-end gap-4">
                        <span className="text-sm text-gray-500">Subtotal</span>
                        <span className="text-sm font-medium text-gray-700">{formatPrice(item.price)}</span>
                      </div>
                      <div className="flex justify-between md:justify-end gap-4">
                        <span className="text-sm text-gray-500">Envío</span>
                        <span className="text-sm font-medium text-gray-700">S/ 0.00</span>
                      </div>
                      <div className="flex justify-between md:justify-end gap-4 pt-2 border-t border-gray-100">
                        <span className="text-sm font-semibold text-gray-700">Total</span>
                        <span className="text-lg font-bold text-gray-800">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </article>

              {/* Buyer/Seller info */}
              <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-6 text-gray-700">
                    {isSeller ? "Datos del comprador" : "Datos del vendedor"}
                  </h2>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-gray-800">{isSeller ? buyerName : sellerName}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                          {isSeller ? (
                            <>
                              {order.buyer_phone && (
                                <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {order.buyer_phone}</span>
                              )}
                              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {order.buyer_email}</span>
                            </>
                          ) : (
                            <>
                              {order.seller_phone && (
                                <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {order.seller_phone}</span>
                              )}
                              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {order.seller_email}</span>
                            </>
                          )}
                        </div>
                        {isSeller && order.buyer_address && (
                          <div className="flex items-start gap-1 text-sm text-gray-500 pt-1">
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{order.buyer_address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {(isSeller || !order.bid_info || (order.bid_info.ganador_id && getCurrentUserId() === order.bid_info.ganador_id)) && (
                    <button
                      onClick={() => handleContact(isSeller ? order.user_id : order.seller_id)}
                      className="border border-purple-500 text-purple-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Contactar
                    </button>
                    )}
                    {order.remaining_balance && order.status === "pending_payment" && (
                      <button onClick={() => router.push(`/checkout?source=remaining_balance&order_id=${order.id}&amount=${order.total_amount}`)}
                        className="border border-green-500 text-green-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        Pagar saldo
                      </button>
                    )}
                  </div>
                </div>
              </article>

              {/* Shipping info */}
              {(order.shipping_address || isSeller) && (
                <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold mb-6 text-gray-700">Información de envío</h2>
                  <div className="space-y-4 max-w-lg">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-400">Método de entrega</span>
                      <span className="text-sm font-bold text-gray-800">Delivery</span>
                    </div>
                    {order.shipping_address && (
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-400">Dirección</span>
                        <span className="text-sm font-medium text-gray-800 text-right">
                          {order.shipping_address}<br />
                          {order.shipping_city && <>{order.shipping_city}</>}
                        </span>
                      </div>
                    )}
                    {order.shipping_reference && (
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-400">Referencia</span>
                        <span className="text-sm font-medium text-gray-800">{order.shipping_reference}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-400">Coordinación</span>
                      <span className="text-sm font-medium text-purple-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        {STEP_NAMES[order.tracking_status] || "Pendiente"}
                      </span>
                    </div>
                    {order.tracking_number && (
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-400">Nº de seguimiento</span>
                        <span className="text-sm font-medium text-gray-800">{order.tracking_number}</span>
                      </div>
                    )}
                    {order.shipping_notes && (
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-400">Notas</span>
                        <span className="text-sm font-medium text-gray-800">{order.shipping_notes}</span>
                      </div>
                    )}
                  </div>
                </article>
              )}

              {/* Seller tracking controls */}
              {isSeller && ["paid", "completed"].includes(order.status) && (
                <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold mb-6 text-gray-700">Gestionar envío</h2>
                  <div className="space-y-4">
                    {STEP_LABELS.map((step, idx) => {
                      const stepIdx = getStepIndex(step);
                      const current = getStepIndex(order.tracking_status);
                      const completed = stepIdx <= current;
                      const dateField = step === "coordination" ? order.tracking_coordination_at
                        : step === "shipping" ? order.tracking_shipping_at
                        : step === "delivered" ? order.tracking_delivered_at
                        : order.created_at;
                      return (
                        <div key={step} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${completed ? "bg-purple-500" : "bg-gray-200"}`}>
                              {completed ? <Check className="w-4 h-4 text-white" /> : <span className="text-xs font-bold text-gray-500">{idx + 1}</span>}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${completed ? "text-gray-700" : "text-gray-400"}`}>{STEP_NAMES[step]}</p>
                              <p className="text-[10px] text-gray-400">{dateField ? formatDate(dateField) : "Pendiente"}</p>
                            </div>
                          </div>
                          {!completed && stepIdx === current + 1 && step === "coordination" && (
                            <button onClick={() => handleUpdateTracking(step)} disabled={saving}
                              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-40">
                              {saving ? "..." : "Marcar"}
                            </button>
                          )}
                          {!completed && stepIdx === current + 1 && step === "shipping" && (
                            <button onClick={() => setShowShippingForm(true)}
                              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700">
                              Gestionar
                            </button>
                          )}
                          {!completed && stepIdx === current + 1 && step === "delivered" && (
                            <button onClick={() => handleUpdateTracking(step)} disabled={saving}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-40">
                              {saving ? "..." : "Entregado"}
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {showShippingForm && (
                      <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700">Datos de envío</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <input value={shipAddress} onChange={(e) => setShipAddress(e.target.value)} placeholder="Dirección de envío" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg col-span-2" />
                          <input value={shipCity} onChange={(e) => setShipCity(e.target.value)} placeholder="Ciudad" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                          <input value={shipRef} onChange={(e) => setShipRef(e.target.value)} placeholder="Referencia" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                          <input type="date" value={estimatedDate} onChange={(e) => setEstimatedDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                          <input value={trackNum} onChange={(e) => setTrackNum(e.target.value)} placeholder="Número de seguimiento" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                        </div>
                        <textarea value={shipNotes} onChange={(e) => setShipNotes(e.target.value)} placeholder="Notas adicionales" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" rows={2} />
                        <div className="flex gap-2">
                          <button onClick={() => setShowShippingForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">Cancelar</button>
                          <button onClick={() => handleUpdateTracking("shipping")} disabled={saving} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40">
                            {saving ? "Guardando..." : "Confirmar envío"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )}

              {/* Reviews section */}
              {orderReviews.length > 0 && (
                <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold mb-6 text-gray-700">Reseñas</h2>
                  <div className="space-y-4">
                    {orderReviews.map((r) => (
                      <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-700">{r.user_first_name || r.user_email}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{r.comment || "Sin comentario"}</p>
                        {r.images?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {r.images.map((url: string, i: number) => (
                              <img key={i} src={getImageUrl(url)} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{r.product_title}</p>
                      </div>
                    ))}
                  </div>
                </article>
              )}
            </div>

            {/* Right column */}
            <aside className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold mb-6 text-gray-700 border-b border-gray-100 pb-2">Resumen rápido</h2>
                <div className="space-y-5">
                  {order.bid_info && (
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg p-3 mb-2">
                      <svg className="w-5 h-5 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0l0 0a2.12 2.12 0 0 1 0-3L11 10" />
                        <path d="m16 16 3.5 3.5c.83.83 2.17.83 3 0l0 0a2.12 2.12 0 0 0 0-3L19 13" />
                        <path d="m15 11 3-3" /><path d="m8 4 3 3" /><path d="m2 2 16 16" /><path d="m2 11 9-9" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-purple-700">Subasta - Puja de S/ {Number(order.bid_info.bid_amount).toFixed(2)}</p>
                        <p className="text-[10px] text-purple-500">Garantía pagada: S/ {Number(order.total_amount).toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Estado actual</span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-700 rounded-md text-[11px] font-medium border border-green-100">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {STEP_NAMES[order.tracking_status] || "Pendiente"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Pago</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[11px] font-bold">Pagado</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Método de pago</span>
                    <span className="text-sm font-medium text-gray-700">Depósito bancario</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-500">Fecha de pedido</span>
                    <span className="text-sm font-medium text-gray-700 text-right leading-tight">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">ID operación</span>
                    <span className="text-sm font-medium text-gray-700">{order.operation_number || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{isSeller ? "Comprador" : "Vendedor"}</span>
                    <span className="text-sm font-medium text-gray-700">{isSeller ? buyerName : sellerName}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
