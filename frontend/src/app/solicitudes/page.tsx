"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PackageSearch, Plus, MapPin, Clock, Gavel } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getRequests, getCategories } from "@/lib/api";
import type { BuyerRequest, Category } from "@/lib/api";

const PER_PAGE = 9;

function priceLabel(r: BuyerRequest) {
  const min = r.precio_minimo != null ? Number(r.precio_minimo) : null;
  const max = r.precio_maximo != null ? Number(r.precio_maximo) : null;
  if (min != null && max != null) return `S/ ${min.toFixed(2)} - S/ ${max.toFixed(2)}`;
  if (min != null) return `Desde S/ ${min.toFixed(2)}`;
  if (max != null) return `Hasta S/ ${max.toFixed(2)}`;
  return "A convenir";
}

function deadline(r: BuyerRequest) {
  if (!r.fecha_limite) return null;
  const d = new Date(r.fecha_limite);
  const now = Date.now();
  if (d.getTime() < now) return "Vencida";
  const days = Math.ceil((d.getTime() - now) / 86400000);
  return days <= 1 ? "Vence pronto" : `Vence en ${days} días`;
}

export default function SolicitudesPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    getCategories().then(cs => setCategories(cs.filter(c => c.status === "active")));
  }, []);

  const load = useCallback(async () => {
    const res = await getRequests({
      category_id: selectedCategory || undefined,
      q: searchQuery || undefined,
      page,
      limit: PER_PAGE,
    });
    setRequests(res.items);
    setTotal(res.total);
  }, [selectedCategory, searchQuery, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 md:px-8 pt-28 md:pt-36 pb-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                <PackageSearch className="w-7 h-7 text-[#8234FE]" />
                Solicitudes de compra
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Compradores publican qué necesitan. Publica tu oferta si tienes un producto que coincide.
              </p>
            </div>
            <button
              onClick={() => router.push("/perfil/solicitudes/nueva")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8234FE] to-[#26BEFE] text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Publicar mi solicitud
            </button>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Buscar por producto o especificación..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
              className="md:w-64 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">Todas las categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Listado */}
          {requests.length === 0 ? (
            <div className="text-center py-20">
              <PackageSearch className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">No hay solicitudes activas en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {requests.map(r => (
                <Link
                  key={r.id}
                  href={`/solicitudes/${r.id}`}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-primary-200 transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary-50 text-[#8234FE] border border-primary-100">
                      {categories.find(c => c.id === r.category_id)?.name || "General"}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-50 text-green-600">
                      Activa
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug mb-1">{r.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">
                    {r.description || "El comprador no agregó una descripción."}
                  </p>
                  <div className="text-[13px] font-bold text-[#8234FE] mb-2">{priceLabel(r)}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                    <span className="inline-flex items-center gap-1"><Plus className="w-3 h-3" /> {r.cantidad} unid.</span>
                    <span className="inline-flex items-center gap-1"><Gavel className="w-3 h-3" /> {r.offers_count ?? 0} ofertas</span>
                    {deadline(r) && (
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {deadline(r)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                    p === page ? "bg-gradient-to-r from-[#8234FE] to-[#26BEFE] text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
