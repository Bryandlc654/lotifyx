"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getHelpArticles, HelpArticle } from "@/lib/api";
import { ChevronDown, Search, HelpCircle, ChevronRight, Loader2 } from "lucide-react";

export default function AyudaPage() {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHelpArticles().then(setArticles).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(articles.filter(a => a.status === "published").map(a => a.category)));

  const grouped: Record<string, HelpArticle[]> = {};
  articles.filter(a => a.status === "published").forEach(a => {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  });

  const filtered = searchQuery.trim()
    ? articles.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const filteredGrouped: Record<string, HelpArticle[]> = {};
  filtered.forEach(a => {
    if (!filteredGrouped[a.category]) filteredGrouped[a.category] = [];
    filteredGrouped[a.category].push(a);
  });

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-[#f5f6f8]">
        <section className="bg-gradient-to-br from-[#8234FE] to-[#26BEFE] text-white">
          <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white/90 text-xs font-semibold mb-4">
              <HelpCircle className="h-3.5 w-3.5" />
              Centro de ayuda
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">¿En qué podemos ayudarte?</h1>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">Encuentra respuestas y tutoriales sobre cómo usar Lotifyx.</p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar en el centro de ayuda..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-lg" />
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-12">
          <nav className="flex items-center gap-2 text-sm mb-10 text-gray-400">
            <Link href="/" className="hover:text-gray-600 transition-colors">Inicio</Link>
            <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
            <span className="text-[#8234FE] font-semibold">Centro de ayuda</span>
          </nav>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : searchQuery.trim() ? (
            filtered.length === 0 ? (
              <div className="text-center py-16">
                <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-1">No encontramos resultados para "{searchQuery}"</p>
                <p className="text-gray-400 text-sm">Intenta con otros términos</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-6">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "<strong className="text-gray-700">{searchQuery}</strong>"</p>
                <div className="space-y-2">
                  {filtered.map(a => (
                    <div key={a.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <button onClick={() => setOpenId(openId === a.id ? null : a.id)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                        {a.title}
                        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${openId === a.id ? "rotate-90" : ""}`} />
                      </button>
                      {openId === a.id && (
                        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3 whitespace-pre-line">{a.content}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : articles.filter(a => a.status === "published").length === 0 ? (
            <div className="text-center py-16">
              <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay artículos de ayuda disponibles aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Categorías</h3>
                {categories.map(cat => (
                  <button key={cat} onClick={() => {
                    const el = document.getElementById(`cat-${cat}`);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }} className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-[#8234FE] hover:bg-purple-50 rounded-lg transition-colors">
                    {cat}
                  </button>
                ))}
              </div>

              <div>
                {categories.map(cat => {
                  const items = grouped[cat] || [];
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} id={`cat-${cat}`} className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-gradient-to-b from-[#8234FE] to-[#26BEFE]" />
                        {cat}
                      </h2>
                      <div className="space-y-2">
                        {items.map(a => (
                          <div key={a.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <button onClick={() => setOpenId(openId === a.id ? null : a.id)}
                              className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                              {a.title}
                              <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${openId === a.id ? "rotate-90" : ""}`} />
                            </button>
                            {openId === a.id && (
                              <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3 whitespace-pre-line">{a.content}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
