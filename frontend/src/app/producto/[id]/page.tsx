"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getProduct, getCategories, getCategoryFields, getImageUrl, Product, CategoryField } from "@/lib/api";
import { ChevronDown, Eye, Heart, Truck, Store, XCircle } from "lucide-react";

export default function ProductoDetallePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getProduct(id),
      getCategories(),
      getCategoryFields(),
    ]).then(([p, cats, flds]) => {
      setProduct(p);
      setFields(flds.filter(f => f.category_id === p.category_id));
      const cat = cats.find(c => c.id === p.category_id);
      if (cat) setCategoryName(cat.name);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-24 min-h-screen bg-white flex items-center justify-center">
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
        <main className="pt-24 min-h-screen bg-white flex flex-col items-center justify-center gap-4">
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
      <main className="pt-24 min-h-screen bg-white">
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

          <div className="grid grid-cols-1 lg:grid-cols-[140px_1fr_400px] gap-6">
            {thumbnails.length > 0 && (
              <div className="hidden lg:flex flex-col gap-3">
                {thumbnails.map((img, i) => (
                  <div key={i} className={`bg-gray-100 rounded-lg aspect-square flex items-center justify-center cursor-pointer border-2 overflow-hidden ${i === 0 ? "border-purple-600" : "border-gray-200 hover:border-gray-400"} transition-colors`}>
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className={`bg-gray-100 rounded-xl aspect-square flex items-center justify-center overflow-hidden ${!mainImage ? "" : ""}`}>
              {mainImage ? (
                <img src={getImageUrl(mainImage)} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-lg">Sin imagen</span>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {product.title}
              </h1>

              {product.sku && (
                <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-gray-100 text-xs font-mono font-medium text-gray-500">
                  SKU: {product.sku}
                </span>
              )}

              <div className="mt-4 space-y-2">
                {textEntries.map(([k, v]) => {
                  const val = String(v ?? "");
                  if (!val) return null;
                  return (
                    <div key={k} className="flex gap-2 text-sm">
                      <span className="text-gray-400 w-32 flex-shrink-0 capitalize">{getFieldLabel(k)}</span>
                      <span className="text-gray-700 font-medium">{val}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Eye className="h-4 w-4" />
                  <span>0 vistas</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Heart className="h-4 w-4" />
                  <span>0 guardados</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                {product.envio_delivery && (
                  <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-400 px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all">
                    <Truck className="h-5 w-5" />
                    Envío a domicilio
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
          </div>

          {/* Condiciones de venta */}
          <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 max-w-3xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Condiciones de venta</h3>
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
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
