"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getActiveProducts, getCategories, getImageUrl, Product, Category } from "@/lib/api";
import { Grid3X3, List, ChevronDown, ChevronRight, Tag, Loader2 } from "lucide-react";
import { CategoriesCarousel } from "@/components/home/categories-carousel";

export default function CategoriasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevancia");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [page, setPage] = useState(1);
  const perPage = 9;

  useEffect(() => {
    Promise.all([
      getActiveProducts(selectedCategory || undefined),
      getCategories(),
    ])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  useEffect(() => { setPage(1); }, [selectedCategory]);

  const sorted = [...products].sort((a, b) => {
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
                          onChange={() => setSelectedCategory(cat.id)} className="sr-only" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedCategory === cat.id ? "bg-[#8234FE] border-[#8234FE]" : "border-gray-300 group-hover:border-[#8234FE]"
                        }`}>
                          {selectedCategory === cat.id && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm text-[#161A3A]">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Navega por las categorías</h3>
                <CategoriesCarousel showTitle={false} bgWhite={false} showArrows={false} compact={true} />
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
                    const tipo = product.metodo_pago === "subasta" ? "Subasta" : product.metodo_pago === "venta_por_lote" ? "Venta por lote" : "Venta directa";
                    return (
                      <Link key={product.id} href={`/producto/${product.id}`}
                        className={`bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all group ${
                          viewMode === "list" ? "flex gap-4 p-4" : "p-4 flex flex-col"
                        }`}>
                        <div className={`rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 ${
                          viewMode === "list" ? "w-40 h-32" : "w-full aspect-square mb-3"
                        }`}>
                          {img ? (
                            <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Tag className="h-8 w-8 text-gray-300" />
                            </div>
                          )}
                        </div>

                        <div className={viewMode === "list" ? "flex-1 min-w-0 flex flex-col justify-between" : "flex flex-col flex-1"}>
                          <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{tipo}</p>
                            <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2 group-hover:text-[#8234FE] transition-colors">
                              {product.specifications?.["Título del Producto"] || product.title}
                            </h3>
                          </div>
                          {precio && (
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
