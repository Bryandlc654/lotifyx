"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getEvents, AppEvent } from "@/lib/api";
import { ChevronDown, Loader2, Calendar, MapPin, X } from "lucide-react";

export default function EventosPage() {
  const [items, setItems] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppEvent | null>(null);

  useEffect(() => {
    getEvents().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" });
  }

  function formatTime(d: string) {
    return new Date(d).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  }

  const past = items.filter(e => e.event_date && new Date(e.event_date) < new Date());
  const upcoming = items.filter(e => !e.event_date || new Date(e.event_date) >= new Date());

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-[#f5f6f8]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Eventos</h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Próximos eventos, ferias y actividades de Lotifyx</p>
          </div>
          <nav className="flex items-center gap-2 text-sm mb-10 text-gray-400 justify-center">
            <Link href="/" className="hover:text-gray-600 transition-colors">Inicio</Link>
            <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
            <span className="text-[#8234FE] font-semibold">Eventos</span>
          </nav>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-400 py-20 text-sm">No hay eventos programados aún</p>
          ) : (
            <>
              {upcoming.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    Próximos eventos
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {upcoming.map(ev => (
                      <button key={ev.id} onClick={() => setSelected(ev)} className="text-left w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                        {ev.image_url && (
                          <div className="aspect-video bg-gray-100 overflow-hidden">
                            <img src={ev.image_url.startsWith("http") ? ev.image_url : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${ev.image_url}`} alt={ev.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                            {ev.event_date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(ev.event_date)} — {formatTime(ev.event_date)}</span>}
                          </div>
                          <h3 className="text-base font-bold text-[#161A3A]">{ev.title}</h3>
                          {ev.location && <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{ev.location}</p>}
                          {ev.description && <p className="text-sm text-gray-500 mt-2 line-clamp-3 leading-relaxed">{ev.description}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {past.length > 0 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Eventos pasados</h2>
                  <div className="space-y-4">
                    {past.map(ev => (
                      <button key={ev.id} onClick={() => setSelected(ev)} className="text-left w-full bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 opacity-70 hover:opacity-100 transition-opacity">
                        {ev.image_url && (
                          <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                            <img src={ev.image_url.startsWith("http") ? ev.image_url : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${ev.image_url}`} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900">{ev.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            {ev.event_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(ev.event_date)}</span>}
                            {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {selected.image_url && (
              <div className="aspect-video bg-gray-100">
                <img src={selected.image_url.startsWith("http") ? selected.image_url : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${selected.image_url}`} alt={selected.title} className="w-full h-full object-cover rounded-t-2xl" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
                <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
                {selected.event_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {new Date(selected.event_date).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                {selected.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {selected.location}
                  </span>
                )}
              </div>
              {selected.description && (
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{selected.description}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
