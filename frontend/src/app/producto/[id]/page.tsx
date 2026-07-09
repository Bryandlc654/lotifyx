"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getProduct, getCategories, getCategoryFields, getActiveProducts, getImageUrl, getCurrentUserId, registerProductView, toggleProductSave, getProductSaveStatus, getProductReviews, getAuctionByProduct, placeAuctionBid, Product, CategoryField, Review } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { ChevronDown, Eye, Heart, Truck, Store, XCircle, X, Loader2 } from "lucide-react";
import { joinProductAuction, leaveProductAuction, onAuctionUpdate, offAuctionUpdate } from "@/lib/socket";
import { AuctionCountdown } from "@/components/auction-countdown";
import { toast } from "sonner";
import { LoginModal } from "@/components/layout/login-modal";

export default function ProductoDetallePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"descripcion" | "condiciones">("descripcion");
  const [showCartSuccess, setShowCartSuccess] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);
  const [isOwn, setIsOwn] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savesCount, setSavesCount] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [auction, setAuction] = useState<any>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidding, setBidding] = useState(false);
  const cart = useCart();

  useEffect(() => {
    if (!id) return;
    registerProductView(id).catch(() => {});
    Promise.all([
      getProduct(id),
      getCategories(),
      getCategoryFields(),
    ]).then(([p, cats, flds]) => {
      setProduct(p);
      setSavesCount(p.saves_count || 0);
      setFields(flds.filter(f => f.category_id === p.category_id));
      const cat = cats.find(c => c.id === p.category_id);
      if (cat) setCategoryName(cat.name);
      getActiveProducts(p.category_id).then(relatedProducts => {
        setRelated(relatedProducts.filter(r => r.id !== id).slice(0, 4));
      }).catch(() => {});
      getProductReviews(id).then(setReviews).catch(() => {});
      if (p.metodo_pago === "subasta") {
        getAuctionByProduct(id).then(setAuction).catch(() => {});
        joinProductAuction(id);
        onAuctionUpdate((data) => {
          setAuction((prev: any) => prev ? { ...prev, ...data } : prev);
        });
      }
      const uid = getCurrentUserId();
      setIsOwn(uid === p.user_id);
      if (uid) {
        getProductSaveStatus(id).then(s => setSaved(s.saved)).catch(() => {});
      }
    }).catch(() => {})
    .finally(() => setLoading(false));
    return () => {
      leaveProductAuction(id);
      offAuctionUpdate();
    };
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-24 min-h-screen bg-[#f5f6f8] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="pt-24 min-h-screen bg-[#f5f6f8] flex flex-col items-center justify-center gap-4">
          <XCircle className="h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Producto no encontrado</p>
          <Link href="/categorias" className="text-purple-600 hover:underline text-sm">Volver a categorías</Link>
        </main>
        <Footer />
      </>
    );
  }

  const specs = product.specifications || {};
  const entries = Object.entries(specs);

  const imageEntries = entries.filter(([, v]) => {
    const s = String(v ?? "");
    return s.startsWith("/uploads/") || s.startsWith("[");
  });
  const textEntries = entries.filter(([, v]) => {
    const s = String(v ?? "");
    return !s.startsWith("/uploads/") && !s.startsWith("[");
  });

  const titleKeys = ["título del producto", "titulo del producto", "title", "nombre del producto"];
  const priceKeys = ["precio", "price"];
  const sidebarKeys = ["tipo de producto", "marca", "modelo", "stock"];

  const sidebarSpecs = textEntries.filter(([k]) => {
    const key = k.toLowerCase().replace(/_/g, " ");
    return sidebarKeys.some(s => key.includes(s));
  });

  const textSpecs = textEntries.filter(([k]) => {
    const key = k.toLowerCase().replace(/_/g, " ");
    return !titleKeys.some(t => key.includes(t)) && !priceKeys.some(p => key.includes(p)) && !sidebarKeys.some(s => key.includes(s));
  });

  const priceEntries = textEntries.filter(([k]) => {
    const key = k.toLowerCase().replace(/_/g, " ");
    return priceKeys.some(p => key.includes(p));
  });

  const priceRegular = priceEntries.find(([k]) => {
    const key = k.toLowerCase();
    return key.includes("regular") || key.includes("original") || key.includes("antes");
  });
  const priceCurrent = priceEntries.find(([k]) => {
    const key = k.toLowerCase();
    return !key.includes("regular") && !key.includes("original") && !key.includes("antes");
  }) || (priceRegular ? priceEntries.find(([k]) => k !== priceRegular[0]) : null);

  const allImages: string[] = [];
  imageEntries.forEach(([, v]) => {
    const s = String(v ?? "");
    if (s.startsWith("[")) {
      try { allImages.push(...JSON.parse(s)); } catch {}
    } else if (s.startsWith("/uploads/")) {
      allImages.push(s);
    }
  });

  const mainImage = allImages[0] || "";
  const thumbnails = allImages.slice(0, 4);

  function getFieldLabel(key: string): string {
    const f = fields.find(f => f.name === key);
    return f?.label || key.replace(/_/g, " ");
  }

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-[#f5f6f8]">
        <div className="max-w-7xl mx-auto px-6 py-6">

          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">Inicio</Link>
            <ChevronDown className="h-3 w-3 text-gray-300 rotate-[-90deg]" />
            <Link href="/categorias" className="text-purple-600 font-semibold hover:text-purple-700 transition-colors">
              {categoryName || "Categoría"}
            </Link>
            <ChevronDown className="h-3 w-3 text-gray-300 rotate-[-90deg]" />
            <span className="text-purple-600 font-semibold truncate max-w-[200px]">{product.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[140px_1fr_360px] gap-6 mb-6">
            {thumbnails.length > 0 && (
              <div className="hidden lg:flex flex-col gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
                {thumbnails.map((img, i) => (
                  <div key={i} className={`bg-gray-100 rounded-lg aspect-square flex items-center justify-center cursor-pointer border-2 overflow-hidden ${i === 0 ? "border-purple-600" : "border-gray-200 hover:border-gray-400"} transition-colors`}>
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-center overflow-hidden">
              {mainImage ? (
                <img src={getImageUrl(mainImage)} alt={product.title} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-gray-400 text-lg">Sin imagen</span>
              )}
            </div>

            {/* Product info sidebar - Auction */}
            {product.metodo_pago === "subasta" && auction ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
                <h1 className="text-[#2d3748] text-[28px] font-extrabold leading-tight mb-4">{product.title}</h1>
                {sidebarSpecs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {sidebarSpecs.map(([k, v]) => {
                      const val = String(v ?? "");
                      if (!val) return null;
                      return (
                        <span key={k} className="px-3 py-1 bg-[#f3efff] text-[#a885f7] text-[12px] font-semibold rounded-full">
                          {val}
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="flex justify-between items-center text-[13px] text-gray-500 font-medium mb-6">
                  <p>Estado: <span className="text-gray-700">Nuevo</span></p>
                  <p>LOT: <span className="text-gray-700 font-bold uppercase">{product.sku || product.id.slice(0, 8)}</span></p>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden mb-6">
                  <div className="bg-[#f8f6ff] p-4 flex justify-between items-start">
                    <div className="flex flex-col">
                      <h3 className="text-[#8b5cf6] font-bold text-[16px]">Esta publicación es una subasta</h3>
                      <p className="text-gray-500 text-[13px]">Realiza tu mejor oferta y gana el producto</p>
                    </div>
                    <svg className="w-8 h-8 text-[#8b5cf6] opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
                      <path d="m16 16 3.5 3.5c.83.83 2.17.83 3 0 0 0 0 0 0 0a2.12 2.12 0 0 0 0-3L19 13" />
                      <path d="m15 11 3-3" /><path d="m8 4 3 3" /><path d="m2 2 16 16" /><path d="m2 11 9-9" />
                    </svg>
                  </div>
                  <div className="divide-y border-[#e5e7eb]">
                    <div className="flex justify-between items-center p-4">
                      <span className="text-gray-500 text-[15px]">Precio base</span>
                      <span className="text-[#2d3748] font-bold text-[16px]">S/ {Number(auction.precio_inicial).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    {auction.bid_count > 0 ? (
                      <div className="flex justify-between items-start p-4 bg-white">
                        <span className="text-gray-500 text-[15px] pt-1">Puja actual</span>
                        <div className="text-right">
                          <div className="text-[#8b5cf6] font-bold text-[18px]">S/ {Number(auction.precio_actual).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                          <div className="text-[11px] text-gray-400">{auction.bid_count} puja{auction.bid_count > 1 ? "s" : ""}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center p-4">
                        <span className="text-gray-500 text-[15px]">Puja actual</span>
                        <span className="text-gray-400 text-[15px]">Sin pujas aún</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-4">
                      <span className="text-gray-500 text-[15px]">Incremento mínimo</span>
                      <span className="text-[#2d3748] font-bold text-[16px]">S/ {Number(auction.incremento_minimo).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4">
                      <span className="text-gray-500 text-[15px]">Cierre de subasta</span>
                      <span className="text-[#2d3748] font-bold text-[16px]">{new Date(auction.fecha_fin).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="px-4 pb-4">
                      <AuctionCountdown endDate={auction.fecha_fin} onEnded={() => {
                        getAuctionByProduct(id).then(setAuction).catch(() => {});
                      }} />
                    </div>
                  </div>
                </div>

                <div className="bg-[#fffaf0] rounded-2xl p-5 mb-8 border border-orange-50 relative">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-gray-700 font-bold text-[15px] mb-1">Garantía requerida para participar</h3>
                      <p className="text-[#d97706] font-bold text-[22px] mb-2">S/ {Number(auction.precio_inicial * 0.1).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <svg className="w-9 h-9 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <circle cx="12" cy="11.5" r="2.5" />
                      <path d="m9 11.5 2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-[12px] leading-snug">La garantía es reembolsable sino resultas ganador. Podrás solicitar tu devolución o reutilizar en futuras subastas.</p>
                </div>

                {auction.estado === "cerrado" ? (
                  <div className="space-y-3">
                    {!auction.ganador_id ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-gray-600 font-semibold">Subasta cerrada</p>
                        <p className="text-gray-500 text-sm mt-1">Esta subasta finalizó sin participantes ganadores.</p>
                      </div>
                    ) : getCurrentUserId() === auction.ganador_id ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                        <p className="text-green-700 font-bold text-lg">¡Felicidades, ganaste la subasta!</p>
                        <p className="text-green-600 text-sm mt-1">Tu puja de S/ {Number(auction.highest_bid || auction.precio_actual).toFixed(2)} fue la ganadora.</p>
                        <button onClick={() => router.push(auction.remaining_order_id ? `/perfil/pedido/${auction.remaining_order_id}` : "/perfil/mis-compras")}
                          className="mt-3 w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors text-sm">
                          Pagar saldo pendiente
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-gray-600 font-semibold">Subasta cerrada</p>
                        <p className="text-gray-500 text-sm mt-1">Esta subasta ya finalizó. No resultaste ganador.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => {
                    if (!getCurrentUserId()) { setShowLoginModal(true); return; }
                    const minBid = auction.highest_bid
                      ? Number(auction.highest_bid) + Number(auction.incremento_minimo)
                      : Number(auction.precio_inicial);
                    setBidAmount(String(minBid));
                    setShowBidModal(true);
                  }} className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#38bdf8] text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity text-[16px]">
                    Participar en subasta
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {product.sku && (
                  <span className="inline-block mb-1 px-3 py-1 rounded-lg bg-gray-100 text-xs font-mono font-medium text-gray-500">
                    SKU: {product.sku}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-[#344054]">
                  {product.title}
                </h1>

                {sidebarSpecs.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {sidebarSpecs.map(([k, v]) => {
                      const val = String(v ?? "");
                      if (!val) return null;
                      return (
                        <div key={k} className="flex gap-2 text-sm">
                          <span className="text-gray-400 w-32 flex-shrink-0">{getFieldLabel(k)}</span>
                          <span className="text-gray-800 font-medium">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {(product.stock != null && product.stock !== undefined) && (
                  <div className="mt-2 flex gap-2 text-sm">
                    <span className="text-gray-400 w-32 flex-shrink-0">Stock</span>
                    <span className={`font-medium ${product.stock > 0 ? "text-green-700" : "text-red-600"}`}>
                      {product.stock > 0 ? `${product.stock} disponibles` : "Agotado"}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Eye className="h-4 w-4" />
                    <span>{product.views || 0} vistas</span>
                  </div>
                  <button onClick={async () => {
                    if (!getCurrentUserId()) { toast.error("Inicia sesión para guardar productos"); return; }
                    try {
                      const res = await toggleProductSave(id);
                      setSaved(res.saved);
                      setSavesCount(c => res.saved ? c + 1 : Math.max(0, c - 1));
                    } catch { toast.error("Error al guardar"); }
                  }} className="flex items-center gap-1.5 text-sm transition-colors">
                    <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"}`} />
                    <span className={saved ? "text-red-500" : "text-gray-400"}>{savesCount} guardados</span>
                  </button>
                </div>

                {priceEntries.length > 0 && (
                  <div className="mt-6 mb-3">
                    {priceRegular && (
                      <p className="text-sm text-gray-400 line-through">S/ {Number(priceRegular[1]).toFixed(2)}</p>
                    )}
                    <p className={`font-bold text-gray-900 ${priceRegular ? "text-3xl" : "text-2xl"}`}>
                      S/ {Number((priceCurrent || priceEntries[0])[1]).toFixed(2)}
                    </p>
                  </div>
                )}

                {!getCurrentUserId() && (
                  <div className="mb-3">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      <span className="text-xs text-gray-500 leading-tight">
                        Al crear una cuenta significa que aceptas los{" "}
                        <a href="#" className="text-purple-600 hover:underline" onClick={e => e.preventDefault()}>Términos y condiciones</a>{" "}
                        y nuestra{" "}
                        <a href="#" className="text-purple-600 hover:underline" onClick={e => e.preventDefault()}>Política de privacidad</a>
                      </span>
                    </label>
                  </div>
                )}
                <div className="flex gap-3">
                  {isOwn && (
                    <p className="text-sm text-gray-400 italic bg-gray-50 rounded-lg px-4 py-3 flex-1 text-center">Es tu propio producto</p>
                  )}
                  {product.envio_delivery && !isOwn && (
                    <button disabled={product.stock != null && product.stock <= 0}
                      onClick={() => {
                        if (product.stock != null && product.stock <= 0) return;
                        if (!getCurrentUserId()) {
                          if (!acceptTerms) { toast.error("Debes aceptar los términos y condiciones"); return; }
                          setShowLoginModal(true);
                          return;
                        }
                        cart.addItem({
                          id: product.id,
                          title: product.title,
                          sku: product.sku,
                          image: mainImage,
                          price: Number((priceCurrent || priceEntries[0])?.[1] || 0),
                          regularPrice: priceRegular ? Number(priceRegular[1]) : undefined,
                        });
                        setShowCartSuccess(true);
                      }}
                      className={`flex-1 rounded-xl px-4 py-3.5 text-sm font-semibold shadow-md transition-all ${
                        product.stock != null && product.stock <= 0
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-br from-purple-600 to-cyan-400 text-white hover:shadow-lg"
                      }`}>
                      {product.stock != null && product.stock <= 0 ? "Agotado" : "Comprar"}
                    </button>
                  )}
                  {product.envio_courier && (
                    <button className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-purple-600 px-4 py-3.5 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-all">
                      <Store className="h-5 w-5" />
                      Recojo en tienda
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mb-6">
            {/* Tabs: Descripción / Condiciones */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex gap-3 px-6 pt-5 pb-3">
              <button onClick={() => setTab("descripcion")}
                className={`w-fit px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === "descripcion"
                    ? "bg-gradient-to-br from-[#8234FE] to-[#26BEFE] text-white shadow-sm"
                    : "bg-[#E7EAEB] text-[#161A3A] hover:opacity-80"
                }`}>
                Descripción del Producto
              </button>
              <button onClick={() => setTab("condiciones")}
                className={`w-fit px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === "condiciones"
                    ? "bg-gradient-to-br from-[#8234FE] to-[#26BEFE] text-white shadow-sm"
                    : "bg-[#E7EAEB] text-[#161A3A] hover:opacity-80"
                }`}>
                Condiciones
              </button>
            </div>

            <div className="p-6">
              {tab === "descripcion" ? (
                textSpecs.length > 0 ? (
                  <>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden transition-all duration-300 ${descExpanded ? "" : "max-h-[160px]"}`}>
                      {textSpecs.map(([k, v]) => {
                        const val = String(v ?? "");
                        if (!val) return null;
                        const isDescription = ["descripción", "descripcion", "description", "descripción general", "descripcion general"].some(d =>
                          k.toLowerCase().replace(/_/g, " ").includes(d)
                        );
                        return (
                          <div key={k} className={isDescription ? "sm:col-span-2" : ""}>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{getFieldLabel(k)}</span>
                            <p className="text-sm text-gray-700 mt-0.5">{val}</p>
                          </div>
                        );
                      })}
                    </div>
                    {!descExpanded && (
                      <div className="relative mt-2">
                        <div className="absolute bottom-full left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
                        <button onClick={() => setDescExpanded(true)} className="text-sm font-medium text-purple-600 hover:text-purple-700">
                          Ver más
                        </button>
                      </div>
                    )}
                    {descExpanded && (
                      <button onClick={() => setDescExpanded(false)} className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700">
                        Ver menos
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Sin descripción disponible</p>
                )
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Método de pago</span>
                    <p className="text-gray-700 font-medium">{product.metodo_pago || "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Envío</span>
                    <p className="text-gray-700 font-medium">
                      {[product.envio_delivery && "Delivery propio", product.envio_courier && "Courier externo"].filter(Boolean).join(", ") || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Costo envío</span>
                    <p className="text-gray-700 font-medium">S/ {Number(product.costo_envio).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Tiempo entrega</span>
                    <p className="text-gray-700 font-medium">{product.tiempo_entrega || "-"}</p>
                  </div>
                  {product.cambios && (
                    <div>
                      <span className="text-gray-400">Cambios</span>
                      <p className="text-gray-700 font-medium">{product.cambios}</p>
                    </div>
                  )}
                  {product.devoluciones && (
                    <div>
                      <span className="text-gray-400">Devoluciones</span>
                      <p className="text-gray-700 font-medium">{product.devoluciones}</p>
                    </div>
                  )}
                  {product.garantia && (
                    <div>
                      <span className="text-gray-400">Garantía</span>
                      <p className="text-gray-700 font-medium">{product.garantia}</p>
                    </div>
                  )}
                  {product.politicas_imagenes && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-400">Políticas de imágenes</span>
                      <p className="text-gray-700 font-medium">{product.politicas_imagenes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

            {/* Agendar visita */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Agendar visita</h3>
                <p className="text-xs text-gray-500 mb-3">Las visitas requieren cita previa. Te brindamos la ubicación al agendarla.</p>
                <button className="flex items-center gap-2 w-fit rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:opacity-80 transition-opacity" style={{ backgroundColor: "#F4F6F7" }}>
                  <span className="bg-green-500 rounded-full p-1.5 flex items-center justify-center">
                    <svg className="h-4 w-4" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </span>
                  Agendar cita
                </button>
              </div>
          </div>

          {/* Product Reviews */}
          {reviews.length > 0 && (
            <section className="mt-12 max-w-5xl mx-auto space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800">Opiniones de este producto</h2>
                  {reviews[0]?.seller_first_name && (
                    <p className="text-xs text-gray-400 mt-0.5">Vendido por {reviews[0].seller_first_name} {reviews[0].seller_last_name}</p>
                  )}
                </div>
                <div className="p-8 flex flex-col md:flex-row items-center md:items-start gap-12">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-6xl font-extrabold text-gray-900">
                        {(() => {
                          const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
                          return avg % 1 === 0 ? avg.toFixed(0) : avg.toFixed(1);
                        })()}
                      </span>
                      <svg className="w-10 h-10 text-amber-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">Basado en {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex-1 w-full max-w-xs space-y-1">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-4">{star} <span className="text-purple-600">★</span></span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map(r => (
                  <div key={r.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                          {(r.user_first_name?.[0] || "U").toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800">{r.user_first_name} {r.user_last_name}</h4>
                          <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("es-PE")}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} className={s <= r.rating ? "text-amber-400" : "text-gray-300"}>★</span>
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                    {r.images && r.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {r.images.map((img, i) => (
                          <img key={i} src={getImageUrl(img)} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Products */}
          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Productos relacionados</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {related.map(r => {
                  const rSpecs = r.specifications || {};
                  const rEntries = Object.entries(rSpecs);
                  const rImgEntries = rEntries.filter(([, v]) => {
                    const s = String(v ?? "");
                    return s.startsWith("/uploads/") || s.startsWith("[");
                  });
                  const rPriceEntries = rEntries.filter(([k]) => {
                    const key = k.toLowerCase().replace(/_/g, " ");
                    return key.includes("precio") || key.includes("price");
                  });
                  const rPriceRegular = rPriceEntries.find(([k]) => {
                    const key = k.toLowerCase();
                    return key.includes("regular") || key.includes("original") || key.includes("antes");
                  });
                  const rPriceCurrent = rPriceEntries.find(([k]) => {
                    const key = k.toLowerCase();
                    return !key.includes("regular") && !key.includes("original") && !key.includes("antes");
                  }) || (rPriceRegular ? rPriceEntries.find(([k]) => k !== rPriceRegular[0]) : null);

                  let rImage = "";
                  if (rImgEntries.length > 0) {
                    const v = String(rImgEntries[0][1] ?? "");
                    if (v.startsWith("[")) {
                      try { const arr = JSON.parse(v); rImage = arr[0] || ""; } catch {}
                    } else {
                      rImage = v;
                    }
                  }

                  const rBrand = rEntries.find(([k]) => /marca|brand|marcha/i.test(k));

                  return (
                    <Link key={r.id} href={`/producto/${r.id}`} className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                        {rImage ? (
                          <img src={getImageUrl(rImage)} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <span className="text-gray-300 text-sm">Sin img</span>
                        )}
                      </div>
                      <div className="p-3">
                        {rBrand && (
                          <p className="text-xs text-[#161A3A] leading-tight">{String(rBrand[1])}</p>
                        )}
                        <h3 className="text-base text-[#344054] leading-snug line-clamp-2 mt-0.5">{r.title}</h3>
                        {rPriceCurrent && (
                          <p className="text-2xl font-semibold text-[#161A3A] mt-1">S/ {Number(rPriceCurrent[1]).toFixed(2)}</p>
                        )}
                        {rPriceRegular && (
                          <p className="text-base font-semibold text-[#98A2B3] line-through">S/ {Number(rPriceRegular[1]).toFixed(2)}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Success modal */}
      {showCartSuccess && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCartSuccess(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[632px] overflow-hidden p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end -mt-2 -mr-2">
              <button onClick={() => setShowCartSuccess(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold" style={{ color: "#151e3f" }}>Producto agregado a tu carrito</h2>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <svg className="h-5 w-5" style={{ color: "#10b981" }} fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                <p className="text-sm font-medium">Haz añadido 1 item a tu compra</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-32 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                  {mainImage ? (
                    <img src={getImageUrl(mainImage)} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin img</div>
                  )}
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-lg leading-snug" style={{ color: "#151e3f" }}>{product.title}</h3>
                  {product.sku && <p className="text-gray-400 text-sm mt-1">Lot: {product.sku}</p>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold" style={{ color: "#151e3f" }}>
                  S/ {Number((priceCurrent || priceEntries[0])?.[1] || 0).toFixed(2)}
                </div>
                {priceRegular && (
                  <div className="text-sm line-through text-gray-400">S/ {Number(priceRegular[1]).toFixed(2)}</div>
                )}
              </div>
            </div>

            <button onClick={() => { setShowCartSuccess(false); router.push("/checkout"); }}
              className="w-full font-semibold py-4 rounded-xl transition-colors duration-200 text-lg shadow-sm text-white" style={{ backgroundColor: "#6b778d" }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "#586375"}
              onMouseOut={e => e.currentTarget.style.backgroundColor = "#6b778d"}>
              Ir a pagar
            </button>
          </div>
        </div>
      )}

      {/* Bid Modal */}
      {showBidModal && auction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBidModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <button onClick={() => setShowBidModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Realizar puja</h3>
            <p className="text-sm text-gray-500 mb-6">Ingresa el monto de tu puja para este producto</p>

            <div className="bg-purple-50 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Puja mínima</span>
                <span className="font-semibold text-gray-800">
                  S/ {(Number(auction.highest_bid || auction.precio_inicial) + Number(auction.incremento_minimo)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Incremento mínimo</span>
                <span className="font-semibold text-gray-800">S/ {Number(auction.incremento_minimo).toFixed(2)}</span>
              </div>
              {auction.bid_count > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Puja actual</span>
                  <span className="font-semibold text-gray-800">S/ {Number(auction.precio_actual).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tu puja</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">S/</span>
                <input type="number" step="0.01" value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Monto mínimo: S/ {(Number(auction.highest_bid || auction.precio_inicial) + Number(auction.incremento_minimo)).toFixed(2)}</p>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Garantía requerida</p>
                  <p className="text-xs text-gray-500 mt-0.5">Al realizar la puja, se te redirigirá al checkout para pagar la garantía de S/ {Number(auction.precio_inicial * 0.1).toFixed(2)}. Este monto es reembolsable.</p>
                </div>
              </div>
            </div>

            <button onClick={async () => {
              const minBid = Number(auction.highest_bid || auction.precio_inicial) + Number(auction.incremento_minimo);
              const amount = parseFloat(bidAmount);
              if (!amount || amount < minBid) {
                toast.error(`La puja mínima es S/ ${minBid.toFixed(2)}`);
                return;
              }
              setBidding(true);
              try {
                const bid = await placeAuctionBid(auction.id, amount);
                toast.success("Puja registrada. Ahora paga la garantía para confirmarla.");
                setShowBidModal(false);
                router.push(`/checkout?source=auction_bid&bid_id=${bid.id}&amount=${(Number(auction.precio_inicial) * 0.1).toFixed(2)}`);
              } catch (e: any) {
                toast.error(e.message || "Error al realizar puja");
              } finally {
                setBidding(false);
              }
            }} disabled={bidding}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-400 text-white font-bold py-3 rounded-xl shadow-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50">
              {bidding ? "Procesando..." : "Confirmar puja"}
            </button>
          </div>
        </div>
      )}

      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <Footer />
    </>
  );
}
