"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getTutorials, Tutorial } from "@/lib/api";
import { ChevronDown, Loader2, Play, X } from "lucide-react";

export default function TutorialesPage() {
  const [items, setItems] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Tutorial | null>(null);

  useEffect(() => {
    getTutorials().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function getYoutubeId(url: string) {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return m ? m[1] : null;
  }

  function getEmbedUrl(url: string | undefined) {
    if (!url) return "";
    const id = getYoutubeId(url);
    if (id) return `https://www.youtube.com/embed/${id}`;
    return url;
  }

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-[#f5f6f8]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Tutoriales</h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Aprende a usar Lotifyx con nuestros videos guía</p>
          </div>
          <nav className="flex items-center gap-2 text-sm mb-10 text-gray-400 justify-center">
            <Link href="/" className="hover:text-gray-600 transition-colors">Inicio</Link>
            <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
            <span className="text-[#8234FE] font-semibold">Tutoriales</span>
          </nav>

          {selected && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
              <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelected(null)} className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors text-sm flex items-center gap-1">
                  <X className="h-4 w-4" /> Cerrar
                </button>
                <div className="aspect-video">
                  <iframe src={getEmbedUrl(selected.video_url)} className="w-full h-full rounded-2xl" allowFullScreen />
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-400 py-20 text-sm">No hay tutoriales disponibles aún</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(t => {
                const vid = t.video_url ? getYoutubeId(t.video_url) : null;
                const thumb = t.image_url || (vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null);
                return (
                  <button key={t.id} onClick={() => setSelected(t)}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-left">
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      {thumb ? (
                        <img src={thumb.startsWith("http") ? thumb : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${thumb}`} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-cyan-100">
                          <Play className="h-12 w-12 text-[#8234FE]/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <Play className="h-6 w-6 text-[#8234FE] ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-bold text-[#161A3A] line-clamp-2 group-hover:text-[#8234FE] transition-colors">{t.title}</h3>
                      {t.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{t.description}</p>}
                    </div>
                  </button>
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
