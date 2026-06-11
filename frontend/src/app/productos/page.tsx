"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MOCK_PRODUCTS } from "@/components/productos/mock-products";
import { Grid3X3, List, ChevronDown, Tag, ChevronRight } from "lucide-react";
import { CategoriesCarousel } from "@/components/home/categories-carousel";

export default function ProductosPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevancia");
  const [filters, setFilters] = useState({
    modalidad: [] as string[],
    categoria: [] as string[],
  });

  const [page, setPage] = useState(1);
  const totalPages = 5;

  function toggleFilter(type: string, value: string) {
    const key = type as "modalidad" | "categoria";
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }));
  }

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">Inicio</Link>
            <ChevronDown className="h-3 w-3 text-gray-300 rotate-[-90deg]" />
            <Link href="#" className="text-[#8234FE] font-semibold hover:text-[#7428F0] transition-colors">Tecnología y Gadgets</Link>
            <ChevronDown className="h-3 w-3 text-gray-300 rotate-[-90deg]" />
            <span className="text-[#8234FE] font-semibold">Televisor</span>
          </nav>

          <div className="flex gap-6">
            <aside className="w-[280px] flex-shrink-0 hidden lg:block">
              <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-28">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Filtros</h3>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[#6941C6] mb-3">Modalidad</h4>
                  <div className="space-y-2.5">
                    {["Subasta", "Mercado directo"].map(item => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={filters.modalidad.includes(item)}
                          onChange={() => toggleFilter("modalidad", item)} className="sr-only" />
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          filters.modalidad.includes(item) ? "bg-[#8234FE] border-[#8234FE]" : "border-gray-300 group-hover:border-[#8234FE]"
                        }`}>
                          {filters.modalidad.includes(item) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-[#161A3A]">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[#6941C6] mb-3">Categoría</h4>
                  <div className="space-y-2.5">
                    {["Tecnología y gadgets", "Sector inmobiliario"].map(item => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={filters.categoria.includes(item)}
                          onChange={() => toggleFilter("categoria", item)} className="sr-only" />
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          filters.categoria.includes(item) ? "bg-[#8234FE] border-[#8234FE]" : "border-gray-300 group-hover:border-[#8234FE]"
                        }`}>
                          {filters.categoria.includes(item) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-[#161A3A]">{item}</span>
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
                <span className="text-sm text-gray-500">Ordenar por:</span>
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

              <div className={viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"}>
                {MOCK_PRODUCTS.map(product => (
                  <div key={product.id}
                    className={`bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all group ${
                      viewMode === "list" ? "flex gap-4 p-4" : "p-4 flex flex-col"
                    }`}>
                    <div className={`bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      viewMode === "list" ? "w-40 h-32" : "w-full aspect-square mb-3"
                    }`}>
                      <Tag className="h-8 w-8 text-gray-300" />
                    </div>

                    <div className={viewMode === "list" ? "flex-1 min-w-0 flex flex-col justify-between" : "flex flex-col flex-1"}>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{product.brand}</p>
                        <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2 group-hover:text-[#8234FE] transition-colors">
                          {product.name}
                        </h3>
                        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB]">
                          {product.shipping}
                        </span>
                      </div>
                      <div className="text-right mt-3">
                        {product.oldPrice && (
                          <p className="text-sm text-gray-400 line-through">S/ {product.oldPrice.toLocaleString("en-US")}</p>
                        )}
                        <p className="text-lg font-bold text-gray-900">S/ {product.price.toLocaleString("en-US")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-8">
                <div className="flex-1" />
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        page === n
                          ? "bg-[#8234FE] text-white"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex-1 flex justify-end">
                  <button
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 text-sm font-medium text-[#8234FE] hover:text-[#7428F0] transition-colors disabled:opacity-30"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
