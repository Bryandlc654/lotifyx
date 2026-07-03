"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getPressArticles, PressArticle } from "@/lib/api";
import { ChevronDown, Loader2, ExternalLink, Newspaper } from "lucide-react";

export default function PrensaPage() {
  const [items, setItems] = useState<PressArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPressArticles().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-[#f5f6f8]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-4">
              <Newspaper className="h-3.5 w-3.5" /> Notas de prensa
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Prensa</h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Apariciones en medios y comunicados oficiales de Lotifyx</p>
          </div>
          <nav className="flex items-center gap-2 text-sm mb-10 text-gray-400 justify-center">
            <Link href="/" className="hover:text-gray-600 transition-colors">Inicio</Link>
            <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
            <span className="text-[#8234FE] font-semibold">Prensa</span>
          </nav>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-20"><Newspaper className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-400 text-sm">No hay notas de prensa aún</p></div>
          ) : (
            <div className="space-y-4">
              {items.map(a => (
                <a key={a.id} href={a.link} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                  <div className="flex items-start gap-5">
                    {a.image_url && (
                      <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 hidden sm:block">
                        <img src={a.image_url.startsWith("http") ? a.image_url : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${a.image_url}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <span className="font-semibold text-[#8234FE]">{a.source}</span>
                        {a.published_at && <><span>·</span><span>{new Date(a.published_at).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })}</span></>}
                      </div>
                      <h2 className="text-lg font-bold text-[#161A3A] group-hover:text-[#8234FE] transition-colors flex items-center gap-2">
                        {a.title}
                        <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-[#8234FE] flex-shrink-0" />
                      </h2>
                      {a.excerpt && <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{a.excerpt}</p>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
