"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getActiveProducts, getCategories, getRequests, getImageUrl, Product, Category, BuyerRequest } from "@/lib/api";
import { Grid3X3, List, ChevronDown, ChevronRight, Tag, Loader2, Search, X, PackageSearch, Plus, Clock } from "lucide-react";
import { CategoriesCarousel } from "@/components/home/categories-carousel";

function priceLabel(r: BuyerRequest) {
  const min = r.precio_minimo != null ? Number(r.precio_minimo) : null;
  const max = r.precio_maximo != null ? Number(r.precio_maximo) : null;
  if (min != null && max != null) return `S/ ${min.toFixed(2)} - S/ ${max.toFixed(2)}`;
  if (min != null) return `Desde S/ ${min.toFixed(2)}`;
  if (max != null) return `Hasta S/ ${max.toFixed(2)}`;
  return "A convenir";
}

function requestDeadline(r: BuyerRequest) {
  if (!r.fecha_limite) return null;
  const d = new Date(r.fecha_limite);
  const now = Date.now();
  if (d.getTime() < now) return "Vencida";
  const days = Math.ceil((d.getTime() - now) / 86400000);
  return days <= 1 ? "Vence pronto" : `Vence en ${days} días`;
}

function AuctionCountdown({ fechaFin }: { fechaFin: string }) {
  const [remaining, setRemaining] = useState("—");
  const [porCerrar, setPorCerrar] = useState(false);
  useEffect(() => {
    function tick() {
      const diff = new Date(fechaFin).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Finalizada"); setPorCerrar(false); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${String(s).padStart(2, "0")}s`);
      setPorCerrar(diff <= 3600000);
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [fechaFin]);
  const label = remaining === "Finalizada" ? "Finalizada" : porCerrar ? "Por cerrar" : "En vivo";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${porCerrar ? "text-red-600" : "text-orange-600"}`}>
      <Clock className="h-3.5 w-3.5" /> {label} · {remaining}
    </span>
  );
}

export default function CategoriasPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevancia");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [selectedModalidad, setSelectedModalidad] = useState<string>("");
  const [precioMinInput, setPrecioMinInput] = useState("");
  const [precioMaxInput, setPrecioMaxInput] = useState("");
  const [ubicacionInput, setUbicacionInput] = useState("");
  const [vendedorInput, setVendedorInput] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [precioMin, setPrecioMin] = useState<number | undefined>(undefined);
  const [precioMax, setPrecioMax] = useState<number | undefined>(undefined);
  const [ubicacion, setUbicacion] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 9;

  // Read URL params once on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("q") || "";
    const cat = url.searchParams.get("cat") || "";
    setSearchQuery(q);
    if (cat) setSelectedCategory(cat);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("q") || "";
    const catId = selectedSubcategory || selectedCategory || undefined;
    const reqCatId = selectedCategory || undefined;
    Promise.all([
      getActiveProducts(catId, q || undefined, undefined, { precioMin, precioMax, ubicacion: ubicacion || undefined, vendedor: vendedor || undefined, estado: selectedEstado || undefined }),
      getCategories(),
      getRequests({ category_id: reqCatId, q: q || undefined, limit: 6 }),
    ])
      .then(([prods, cats, reqs]) => {
        setProducts(prods);
        setCategories(cats);
        setRequests(reqs.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedSubcategory, precioMin, precioMax, ubicacion, vendedor, selectedEstado]);

  useEffect(() => { setPage(1); setSelectedSubcategory(""); }, [selectedCategory]);
  useEffect(() => { setPage(1); }, [precioMin, precioMax, ubicacion, vendedor, selectedEstado]);

  function aplicarFiltros() {
    const min = precioMinInput.trim() !== "" ? Number(precioMinInput) : undefined;
    const max = precioMaxInput.trim() !== "" ? Number(precioMaxInput) : undefined;
    if (min != null && (!Number.isFinite(min) || min < 0)) { return; }
    if (max != null && (!Number.isFinite(max) || max < 0)) { return; }
    if (min != null && max != null && min > max) { return; }
    setPrecioMin(min);
    setPrecioMax(max);
    setUbicacion(ubicacionInput.trim());
    setVendedor(vendedorInput.trim());
  }

  const filteredByModalidad = selectedModalidad
    ? products.filter(p => p.metodo_pago === selectedModalidad || (!selectedModalidad))
    : products;
  const sorted = [...filteredByModalidad].sort((a, b) => {
    if (sortBy === "nuevos") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    const aPrecio = parseFloat(a.specifications?.["Precio Unitario"] || "0");
    const bPrecio = parseFloat(b.specifications?.["Precio Unitario"] || "0");
    if (sortBy === "precio_asc") return aPrecio - bPrecio;
    if (sortBy === "precio_desc") return bPrecio - aPrecio;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const getFirstImage = (p: Product): string | null => {
    const specs = p.specifications || {};
    for (const key of Object.keys(specs)) {
      const val = String(specs[key] || "");
      if (val.startsWith("/uploads/") && !val.startsWith("[")) return val;
      if (val.startsWith("[")) {
        try {
          const arr = JSON.parse(val);
          if (arr.length > 0) return arr[0];
        } catch {}
      }
    }
    return null;
  };

  const getSpecValue = (p: Product, keyPattern: RegExp): string => {
    const specs = p.specifications || {};
    const found = Object.keys(specs).find(k => keyPattern.test(k));
    return found ? String(specs[found]) : "";
  };

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">Inicio</Link>
            <ChevronDown className="h-3 w-3 text-gray-300 rotate-[-90deg]" />
            <span className="text-[#8234FE] font-semibold">Categorías</span>
          </nav>

          <div className="flex gap-6">
            <aside className="w-[280px] flex-shrink-0 hidden lg:block">
              <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-28">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Filtros</h3>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[#6941C6] mb-3">Categoría</h4>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="categoria" checked={selectedCategory === ""}
                        onChange={() => setSelectedCategory("")} className="sr-only" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedCategory === "" ? "bg-[#8234FE] border-[#8234FE]" : "border-gray-300 group-hover:border-[#8234FE]"
                      }`}>
                        {selectedCategory === "" && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm text-[#161A3A]">Todas</span>
                    </label>
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                        <input type="radio" name="categoria" checked={selectedCategory === cat.id}
                          onChange={() => { setSelectedCategory(cat.id); setSelectedSubcategory(""); }} className="sr-only" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          selectedCategory === cat.id ? "bg-[#8234FE] border-[#8234FE]" : "border-gray-300 group-hover:border-[#8234FE]"
                        }`}>
                          {selectedCategory === cat.id && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm text-[#161A3A] font-medium">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Subcategorías */}
                {(() => {
                  const parent = categories.find(c => c.id === selectedCategory);
                  const children = parent?.children?.filter(c => c.status === "active") || [];
                  if (children.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-[#6941C6] mb-3">Subcategoría</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="radio" name="subcategoria" checked={selectedSubcategory === ""}
                            onChange={() => setSelectedSubcategory("")} className="sr-only" />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            selectedSubcategory === "" ? "bg-[#8234FE] border-[#8234FE]" : "border-gray-300 group-hover:border-[#8234FE]"
                          }`}>
                            {selectedSubcategory === "" && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm text-[#161A3A]">Todas</span>
                        </label>
                        {children.map(child => (
                          <label key={child.id} className="flex items-center gap-3 cursor-pointer group">
                            <input type="radio" name="subcategoria" checked={selectedSubcategory === child.id}
                              onChange={() => setSelectedSubcategory(child.id)} className="sr-only" />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              selectedSubcategory === child.id ? "bg-[#8234FE] border-[#8234FE]" : "border-gray-300 group-hover:border-[#8234FE]"
                            }`}>
                              {selectedSubcategory === child.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-sm text-[#161A3A]">{child.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Modalidad */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[#6941C6] mb-3">Modalidad</h4>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="modalidad" checked={selectedModalidad === ""}
                        onChange={() => setSelectedModalidad("")} className="sr-only" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedModalidad === "" ? "bg-[#8234FE] border-[#8234FE]" : "border-gray-300 group-hover:border-[#8234FE]"
                      }`}>
                        {selectedModalidad === "" && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm text-[#161A3A]">Todas</span>
                    </label>
                    {[
                      { value: "plataforma", label: "Venta directa" },
                      { value: "subasta", label: "Subasta" },
                      { value: "venta_por_lote", label: "Venta por lote" },
                    ].map(m => (
                      <label key={m.value} className="flex items-center gap-3 cursor-pointer group">
                        <input type="radio" name="modalidad" checked={selectedModalidad === m.value}
                          onChange={() => setSelectedModalidad(m.value)} className="sr-only" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          selectedModalidad === m.value ? "bg-[#8234FE] border-[#8234FE]" : "border-gray-300 group-hover:border-[#8234FE]"
                        }`}>
                          {selectedModalidad === m.value && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm text-[#161A3A] font-medium">{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Condición del producto */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[#6941C6] mb-3">Condición</h4>
                  <div className="space-y-2">
                    {[
                      { value: "", label: "Todas" },
                      { value: "nuevo", label: "Nuevo" },
                      { value: "usado", label: "Usado" },
                      { value: "reacondicionado", label: "Reacondicionado" },
                    ].map(c => (
                      <label key={c.value || "all"} className="flex items-center gap-3 cursor-pointer group">
                        <input type="radio" name="condicion" checked={selectedEstado === c.value}
                          onChange={() => setSelectedEstado(c.value)} className="sr-only" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          selectedEstado === c.value ? "bg-[#8234FE] border-[#8234FE]" : "border-gray-300 group-hover:border-[#8234FE]"
                        }`}>
                          {selectedEstado === c.value && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm text-[#161A3A] font-medium">{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Precio (rango mínimo-máximo) */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[#6941C6] mb-3">Precio</h4>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" placeholder="Mín." value={precioMinInput}
                      onChange={e => setPrecioMinInput(e.target.value)}
                      className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8234FE]/30 focus:border-[#8234FE]" />
                    <span className="text-gray-400 text-sm">–</span>
                    <input type="number" min="0" placeholder="Máx." value={precioMaxInput}
                      onChange={e => setPrecioMaxInput(e.target.value)}
                      className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8234FE]/30 focus:border-[#8234FE]" />
                  </div>

                  {/* Ubicación / zona */}
                  <h4 className="text-sm font-semibold text-[#6941C6] mb-3 mt-5">Ubicación / zona</h4>
                  <input type="text" placeholder="Distrito, ciudad o zona" value={ubicacionInput}
                    onChange={e => setUbicacionInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") aplicarFiltros(); }}
                    className="w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8234FE]/30 focus:border-[#8234FE]" />

                  {/* Vendedor */}
                  <h4 className="text-sm font-semibold text-[#6941C6] mb-3 mt-5">Vendedor</h4>
                  <input type="text" placeholder="Nombre o correo del vendedor" value={vendedorInput}
                    onChange={e => setVendedorInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") aplicarFiltros(); }}
                    className="w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8234FE]/30 focus:border-[#8234FE]" />

                  <button onClick={aplicarFiltros}
                    className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#8234FE] to-[#26BEFE] text-white text-sm font-semibold py-2 hover:opacity-90 transition-opacity">
                    Aplicar filtros
                  </button>
                  {(precioMin != null || precioMax != null || ubicacion || vendedor) && (
                    <button onClick={() => {
                      setPrecioMinInput(""); setPrecioMaxInput(""); setUbicacionInput(""); setVendedorInput("");
                      setPrecioMin(undefined); setPrecioMax(undefined); setUbicacion(""); setVendedor("");
                    }}
                      className="mt-2 w-full text-xs text-gray-500 hover:text-red-500 transition-colors">
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {searchQuery && (
                <p className="text-sm text-gray-500 mb-3">
                  Resultados para: <span className="font-semibold text-gray-700">"{searchQuery}"</span> ({sorted.length} producto{sorted.length !== 1 ? "s" : ""})
                </p>
              )}

              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Navega por las categorías</h3>
                <CategoriesCarousel showTitle={false} bgWhite={false} showArrows={false} compact={true}
                  selectedCategoryId={selectedCategory} onCategorySelect={setSelectedCategory} />
              </div>

              <div className="flex items-center justify-end gap-4 mb-6">
                <span className="text-sm text-gray-500">{sorted.length} productos</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200">
                  <option value="relevancia">Relevancia</option>
                  <option value="precio_asc">Menor precio</option>
                  <option value="precio_desc">Mayor precio</option>
                  <option value="nuevos">Más nuevos</option>
                </select>
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-primary-50 text-primary-600" : "bg-white text-gray-400 hover:text-gray-600"}`}>
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-primary-50 text-primary-600" : "bg-white text-gray-400 hover:text-gray-600"}`}>
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Solicitudes de compra */}
              {requests.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-2">
                      <PackageSearch className="h-4 w-4 text-[#8234FE]" /> Solicitudes de compra
                    </h3>
                    <Link href="/solicitudes" className="text-sm font-semibold text-[#8234FE] hover:underline">
                      Ver todas
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {requests.map(r => {
                      const catName = categories.find(c => c.id === r.category_id)?.name || "General";
                      const dl = requestDeadline(r);
                      return (
                        <Link
                          key={r.id}
                          href={`/solicitudes/${r.id}`}
                          className="bg-white rounded-xl border border-slate-100 hover:shadow-md hover:border-primary-200 transition-all p-4 flex flex-col group"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-[#8234FE] border border-primary-100">
                              {catName}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                              Solicitud activa
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1 group-hover:text-[#8234FE]">{r.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">
                            {r.description || "El comprador no agregó una descripción."}
                          </p>
                          <div className="text-[13px] font-bold text-[#8234FE] mb-2">{priceLabel(r)}</div>
                          <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100 pt-2">
                            <span className="inline-flex items-center gap-1"><Plus className="w-3 h-3" /> {r.cantidad} unid.</span>
                            <span>{r.offers_count ?? 0} ofertas</span>
                            {dl && (
                              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {dl}</span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                </div>
              ) : paginated.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                  <Tag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No hay productos publicados en esta categoría</p>
                </div>
              ) : (
                <div className={viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"}>
                  {paginated.map(product => {
                    const img = getFirstImage(product);
                    const precio = getSpecValue(product, /precio/i);
                    const esSubasta = product.metodo_pago === "subasta";
                    const esLote = product.metodo_pago === "venta_por_lote";
                    const ai = product.auction_info;
                    const li = product.lot_info;
                    return (
                      <Link key={product.id} href={`/producto/${product.id}`}
                        className={`bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all group ${
                          viewMode === "list" ? "flex gap-4 p-4" : "p-4 flex flex-col"
                        }`}>
                        <div className={`rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative ${
                          viewMode === "list" ? "w-40 h-32" : "w-full aspect-square mb-3"
                        }`}>
                          {img ? (
                            <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Tag className="h-8 w-8 text-gray-300" />
                            </div>
                          )}
                          {esSubasta && ai && (
                            <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full bg-orange-500 text-white uppercase tracking-wide shadow">
                              Subasta activa
                            </span>
                          )}
                          {esLote && li && (
                            <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500 text-white uppercase tracking-wide shadow">
                              Venta por Lote
                            </span>
                          )}
                        </div>

                        <div className={viewMode === "list" ? "flex-1 min-w-0 flex flex-col justify-between" : "flex flex-col flex-1"}>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                                {esSubasta ? "Subasta" : esLote ? "Venta por Lote" : "Venta directa"}
                              </p>
                              {product.nivel_coincidencia && product.nivel_coincidencia !== "estricta" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100 uppercase tracking-wide">
                                  {product.nivel_coincidencia === "flexible" ? "Coincidencia flexible" : "Coincidencia amplia"}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2 group-hover:text-[#8234FE] transition-colors">
                              {product.specifications?.["Título del Producto"] || product.title}
                            </h3>
                          </div>

                          {esSubasta && ai ? (
                            <div className="mt-3 space-y-1">
                              <p className="text-xs text-gray-500">Precio actual</p>
                              <p className="text-lg font-bold text-gray-900 leading-tight">S/ {ai.precio_actual.toLocaleString("en-US")}</p>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-orange-600">
                                  {ai.pujas} {ai.pujas === 1 ? "puja" : "pujas"}
                                </span>
                                <AuctionCountdown fechaFin={ai.fecha_fin} />
                              </div>
                            </div>
                          ) : esLote && li ? (
                            <div className="mt-3 space-y-1">
                              <p className="text-lg font-bold text-gray-900 leading-tight">S/ {(li.precio_individual || parseFloat(precio) || 0).toLocaleString("en-US")}</p>
                              <p className="text-xs text-gray-500">por unidad · lote de {li.cantidad_total}</p>
                              {li.ahorro_unitario > 0 && (
                                <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                  Ahorras S/ {li.ahorro_unitario.toLocaleString("en-US")} por unidad
                                </span>
                              )}
                            </div>
                          ) : precio && (
                            <div className="text-right mt-3">
                              <p className="text-lg font-bold text-gray-900">S/ {parseFloat(precio).toLocaleString("en-US")}</p>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {totalPages > 1 && !loading && (
                <div className="flex items-center justify-between mt-8">
                  <div className="flex-1" />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                      <button key={n} onClick={() => setPage(n)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === n ? "bg-[#8234FE] text-white" : "text-gray-500 hover:bg-gray-100"
                        }`}>{n}</button>
                    ))}
                  </div>
                  <div className="flex-1 flex justify-end">
                    <button onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                      disabled={page >= totalPages}
                      className="flex items-center gap-1 text-sm font-medium text-[#8234FE] hover:text-[#7428F0] transition-colors disabled:opacity-30">
                      Siguiente <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
