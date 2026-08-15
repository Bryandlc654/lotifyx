"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PackageSearch, ArrowLeft, Plus, Clock, Check,
  BadgeCheck, MessageSquare, Truck, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LoginModal } from "@/components/layout/login-modal";
import {
  getRequest, getCategories, getCategoryFields, getMyProducts,
  getRequestOffers, getMyRequestOffer, makeRequestOffer, acceptRequestOffer,
  getCurrentUserId,
} from "@/lib/api";
import type { BuyerRequest, Category, CategoryField, RequestOffer } from "@/lib/api";

export default function SolicitudDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<BuyerRequest | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [offers, setOffers] = useState<RequestOffer[]>([]);
  const [myOffer, setMyOffer] = useState<RequestOffer[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [offerProduct, setOfferProduct] = useState("");
  const [offerPrecio, setOfferPrecio] = useState("");
  const [offerCantidad, setOfferCantidad] = useState("");
  const [offerEnvio, setOfferEnvio] = useState("0");
  const [offerMensaje, setOfferMensaje] = useState("");
  const [sending, setSending] = useState(false);

  const isOwn = !!userId && request?.user_id === userId;

  useEffect(() => {
    const uid = getCurrentUserId();
    setUserId(uid);
    Promise.all([getRequest(id), getCategories(), getCategoryFields()])
      .then(([r, cs, fs]) => {
        setRequest(r);
        setCategories(cs.filter(c => c.status === "active"));
        setFields(fs.filter(f => f.category_id === r?.category_id));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const loadOffers = useCallback(async () => {
    try {
      const [os, mo, mp] = await Promise.all([
        getRequestOffers(id),
        getMyRequestOffer(id),
        getMyProducts(),
      ]);
      setOffers(os);
      setMyOffer(mo);
      setMyProducts((mp || []).filter((p: any) => p.status === "active"));
    } catch (e: any) {
      // El vendedor/extraño no tiene acceso a ver ofertas: ignorar 403
      const os2 = await getMyRequestOffer(id).catch(() => []);
      setMyOffer(os2);
    }
  }, [id]);

  useEffect(() => {
    if (isOwn || userId) loadOffers();
  }, [isOwn, userId, loadOffers]);

  function fieldLabel(key: string) {
    const f = fields.find(x => x.name === key);
    return f?.label || key;
  }

  function specEntries() {
    if (!request?.specifications) return [];
    return Object.entries(request.specifications).filter(([k]) => !/imagen|image|foto|galer/i.test(k));
  }

  async function handleAccept(offer: RequestOffer) {
    if (!window.confirm(`¿Aceptar la oferta de S/ ${Number(offer.precio).toFixed(2)} × ${offer.cantidad} unid. de ${offer.seller?.first_name || "este vendedor"}?`)) return;
    setAcceptingId(offer.id);
    try {
      const res = await acceptRequestOffer(id, offer.id);
      toast.success(res.message || "Oferta aceptada");
      const total = Number(res.total_amount || 0);
      router.push(`/checkout?source=remaining_balance&order_id=${res.order_id}&amount=${total}`);
    } catch (e: any) {
      toast.error(e.message || "Error al aceptar la oferta");
      setAcceptingId(null);
    }
  }

  async function handleOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!offerProduct || !offerPrecio) { toast.error("Selecciona un producto e ingresa el precio"); return; }
    setSending(true);
    try {
      await makeRequestOffer(id, {
        product_id: offerProduct,
        precio: Number(offerPrecio),
        cantidad: Number(offerCantidad) || request?.cantidad || 1,
        costo_envio: Number(offerEnvio) || 0,
        mensaje: offerMensaje || undefined,
      });
      toast.success("Oferta enviada. El comprador la revisará.");
      const mo = await getMyRequestOffer(id);
      setMyOffer(mo);
    } catch (e: any) {
      toast.error(e.message || "Error al enviar la oferta");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
          <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </main>
      </>
    );
  }

  if (!request) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center pt-24 gap-4">
          <PackageSearch className="w-12 h-12 text-slate-300" />
          <p className="text-slate-500">Solicitud no encontrada</p>
          <button onClick={() => router.push("/solicitudes")} className="text-sm text-[#8234FE] font-semibold">Volver a solicitudes</button>
        </main>
        <Footer />
      </>
    );
  }

  const pendingOffer = myOffer.find(o => o.estado === "pendiente");
  const priceLabel = (() => {
    const min = request.precio_minimo != null ? Number(request.precio_minimo) : null;
    const max = request.precio_maximo != null ? Number(request.precio_maximo) : null;
    if (min != null && max != null) return `S/ ${min.toFixed(2)} - S/ ${max.toFixed(2)}`;
    if (min != null) return `Desde S/ ${min.toFixed(2)}`;
    if (max != null) return `Hasta S/ ${max.toFixed(2)}`;
    return "A convenir";
  })();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 md:px-8 pt-28 md:pt-36 pb-16">
          <button
            onClick={() => router.push("/solicitudes")}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a solicitudes
          </button>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary-50 text-[#8234FE] border border-primary-100">
                {categories.find(c => c.id === request.category_id)?.name || "General"}
              </span>
              {request.estado === "abierta" ? (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-50 text-green-600">Activa</span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                  {request.estado === "aceptada" ? "Cerrada (oferta aceptada)" : request.estado === "cancelada" ? "Cancelada" : "Expirada"}
                </span>
              )}
              {request.fecha_limite && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" /> Límite: {new Date(request.fecha_limite).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{request.title}</h1>
            <p className="text-sm text-slate-600 mb-4">{request.description || "Sin descripción adicional."}</p>

            <div className="flex flex-wrap gap-x-8 gap-y-3 py-4 border-y border-slate-100 mb-4">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Rango de precio</p>
                <p className="text-lg font-bold text-[#8234FE]">{priceLabel}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Cantidad</p>
                <p className="text-lg font-bold text-slate-800">{request.cantidad} unid.</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Ofertas recibidas</p>
                <p className="text-lg font-bold text-slate-800">{offers.length || request.offers_count || 0}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Publicado por</p>
                <p className="text-lg font-bold text-slate-800">
                  {request.buyer?.first_name} {request.buyer?.last_name}
                </p>
              </div>
            </div>

            {specEntries().length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Especificaciones solicitadas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specEntries().map(([k, v]) => (
                    <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-[11px] text-slate-400 font-semibold">{fieldLabel(k)}</p>
                      <p className="text-sm font-semibold text-slate-700">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* DUEÑO: ver y aceptar ofertas */}
          {isOwn && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-900">Ofertas recibidas</h2>
                {request.estado === "abierta" && (
                  <button
                    onClick={() => router.push(`/perfil/solicitudes/nueva?id=${request.id}`)}
                    className="text-xs font-semibold text-[#8234FE] hover:underline"
                  >
                    Editar solicitud
                  </button>
                )}
              </div>
              {offers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                  Aún no hay ofertas. Comparte tu solicitud para que los vendedores respondan.
                </div>
              ) : (
                <div className="space-y-3">
                  {offers.map(o => (
                    <div key={o.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8234FE] to-[#26BEFE] text-white flex items-center justify-center font-bold">
                            {(o.seller?.first_name?.[0] || "V").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{o.seller?.first_name} {o.seller?.last_name}</p>
                            <p className="text-xs text-slate-400">{o.product?.title || "Producto ofrecido"}</p>
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-lg font-extrabold text-[#8234FE]">S/ {Number(o.precio).toFixed(2)}</p>
                          <p className="text-xs text-slate-400">× {o.cantidad} unid.</p>
                        </div>
                      </div>
                      {o.costo_envio > 0 && (
                        <p className="text-xs text-slate-500 mt-2 inline-flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Envío: S/ {Number(o.costo_envio).toFixed(2)}
                        </p>
                      )}
                      {o.mensaje && (
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 mt-3">{o.mensaje}</p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-xs text-slate-400">
                          Total: <span className="font-bold text-slate-700">S/ {(Number(o.precio) * o.cantidad + Number(o.costo_envio)).toFixed(2)}</span>
                        </p>
                        {request.estado === "abierta" ? (
                          o.estado === "pendiente" ? (
                            <button
                              onClick={() => handleAccept(o)}
                              disabled={!!acceptingId}
                              className="inline-flex items-center gap-2 bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {acceptingId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Aceptar oferta
                            </button>
                          ) : (
                            <span className={`text-xs font-bold ${o.estado === "aceptada" ? "text-green-600" : "text-slate-400"}`}>
                              {o.estado === "aceptada" ? "✓ Aceptada" : "Rechazada"}
                            </span>
                          )
                        ) : (
                          <span className={`text-xs font-bold ${o.estado === "aceptada" ? "text-green-600" : "text-slate-400"}`}>
                            {o.estado === "aceptada" ? "✓ Aceptada" : "Rechazada"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VENDEDOR: hacer oferta */}
          {!isOwn && request.estado === "abierta" && (
            <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-[#8234FE]" /> Haz tu oferta
              </h2>
              <p className="text-sm text-slate-500 mb-4">El comprador paga mediante depósito y el pago lo aprueba la plataforma.</p>

              {pendingOffer ? (
                <div className="flex items-center gap-3 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <Clock className="w-4 h-4" /> Ya tienes una oferta pendiente en esta solicitud. Espera la decisión del comprador.
                </div>
              ) : (
                <form onSubmit={handleOffer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="form-label">Tu producto *</label>
                    <select value={offerProduct} onChange={e => setOfferProduct(e.target.value)} className="form-input-custom w-full">
                      <option value="">Selecciona uno de tus productos activos</option>
                      {myProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                    {myProducts.length === 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        No tienes productos activos. <button type="button" onClick={() => router.push("/perfil/ofrecer")} className="text-[#8234FE] font-semibold">Publica un producto</button> primero.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Precio unitario (S/) *</label>
                    <input type="number" min="0.01" step="0.01" value={offerPrecio} onChange={e => setOfferPrecio(e.target.value)} className="form-input-custom w-full" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="form-label">Cantidad ofertada</label>
                    <input type="number" min="1" step="1" value={offerCantidad} onChange={e => setOfferCantidad(e.target.value)} className="form-input-custom w-full" placeholder={String(request.cantidad || 1)} />
                  </div>
                  <div>
                    <label className="form-label">Costo de envío (S/)</label>
                    <input type="number" min="0" step="0.01" value={offerEnvio} onChange={e => setOfferEnvio(e.target.value)} className="form-input-custom w-full" placeholder="0.00" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Mensaje / condiciones</label>
                    <textarea value={offerMensaje} onChange={e => setOfferMensaje(e.target.value)} className="form-input-custom w-full min-h-[80px]" placeholder="Ej: entrega en 5 días, incluye flete..." />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={sending || !offerProduct || !offerPrecio}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8234FE] to-[#26BEFE] text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Enviar oferta
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* NO AUTENTICADO */}
          {!isOwn && !userId && request.estado === "abierta" && (
            <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
              <p className="text-sm text-slate-500 mb-3">Inicia sesión para hacer una oferta en esta solicitud.</p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-gradient-to-r from-[#8234FE] to-[#26BEFE] text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-md hover:opacity-90"
              >
                Iniciar sesión
              </button>
            </div>
          )}

          {!isOwn && myOffer.length > 0 && request.estado === "abierta" && !pendingOffer && (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <MessageSquare className="w-3 h-3" />
              {myOffer.map(o => (
                <span key={o.id}>Tu oferta fue {o.estado === "aceptada" ? "aceptada" : o.estado === "rechazada" ? "rechazada" : "enviada"}.</span>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <style>{`
        .form-label { font-size: 0.75rem; font-weight: 700; color: #4b5563; margin-bottom: 0.375rem; display: block; }
        .form-input-custom { font-size: 0.875rem; color: #374151; border-color: #d1d5db; border-radius: 0.5rem; border-width: 1px; padding: 0.5rem 0.75rem; }
        .form-input-custom:focus { outline: 2px solid #a855f7; border-color: transparent; }
      `}</style>
    </>
  );
}
