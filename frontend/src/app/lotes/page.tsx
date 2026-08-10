"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getOpenLots, getImageUrl, LotSale } from "@/lib/api";
import { Users, Package, Loader2, Layers, CalendarClock } from "lucide-react";

function getLotImage(lot: LotSale): string {
  const specs = lot.product_specifications || {};
  for (const key of Object.keys(specs)) {
    const val = String(specs[key] || "");
    if (val.startsWith("/uploads/")) return val;
    if (val.startsWith("[")) {
      try {
        const arr = JSON.parse(val);
        if (arr.length > 0) return arr[0];
      } catch {}
    }
  }
  return "";
}

export default function LotesPage() {
  const [lots, setLots] = useState<LotSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOpenLots()
      .then(setLots)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f5f6f8] pt-24 md:pt-28">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] flex items-center justify-center text-white">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Ventas por lote</h1>
              <p className="text-sm text-gray-500 mt-1">
                Compra todo el lote o reserva unidades. La venta se concreta cuando se alcanza el mínimo o el total.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
            </div>
          ) : lots.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No hay lotes abiertos por el momento</p>
              <p className="text-gray-400 text-sm mt-1">Vuelve pronto, los vendedores están publicando nuevos lotes</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {lots.map(lot => {
                const img = getLotImage(lot);
                const pct = lot.cantidad_total > 0
                  ? Math.min(100, Math.round((lot.cantidad_reservada / lot.cantidad_total) * 100))
                  : 0;
                return (
                  <Link key={lot.id} href={`/producto/${lot.product_id}`}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                      {img ? (
                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Package className="h-10 w-10 text-gray-300" />
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8234FE] bg-purple-50 w-fit px-2 py-0.5 rounded-full">
                        Venta por lote
                      </span>
                      <h3 className="text-base font-semibold text-gray-900 mt-2 line-clamp-2">
                        {lot.product_title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Vendido por {[lot.vendedor_first_name, lot.vendedor_last_name].filter(Boolean).join(" ") || "Vendedor"}
                      </p>

                      <div className="flex items-end justify-between mt-4">
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Precio por unidad</p>
                          <p className="text-2xl font-bold text-gray-900">
                            S/ {Number(lot.precio_individual).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Lote completo</p>
                          <p className="text-sm font-semibold text-gray-700">
                            S/ {Number(lot.precio_lote).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                          <span>{lot.cantidad_reservada} de {lot.cantidad_total} unidades</span>
                          <span className="font-semibold text-[#8234FE]">{pct}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#8234FE] to-[#26BEFE] rounded-full transition-all"
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-gray-400" />
                          {lot.participantes_count} participante{lot.participantes_count !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Package className="h-4 w-4 text-gray-400" />
                          Mínimo {lot.participantes_minimos} unidad{lot.participantes_minimos !== 1 ? "es" : ""}
                        </span>
                        {lot.fecha_cierre && (
                          <span className="flex items-center gap-1.5 ml-auto">
                            <CalendarClock className="h-4 w-4 text-gray-400" />
                            {new Date(lot.fecha_cierre).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                          </span>
                        )}
                      </div>

                      <span className="mt-4 inline-block text-center rounded-xl bg-gradient-to-r from-[#8234FE] to-[#26BEFE] text-white text-sm font-semibold py-2.5 group-hover:opacity-90 transition-opacity">
                        Ver lote
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
