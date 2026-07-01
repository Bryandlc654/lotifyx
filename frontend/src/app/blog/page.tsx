"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getBlogPosts, BlogPost } from "@/lib/api";
import { Calendar, User, ChevronDown, Loader2, ArrowRight } from "lucide-react";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogPosts().then(setPosts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-[#f5f6f8]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Blog</h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Consejos, guías y novedades del mundo del comercio electrónico</p>
          </div>

          <nav className="flex items-center gap-2 text-sm mb-10 text-gray-400 justify-center">
            <Link href="/" className="hover:text-gray-600 transition-colors">Inicio</Link>
            <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
            <span className="text-[#8234FE] font-semibold">Blog</span>
          </nav>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg mb-2">No hay artículos publicados aún</p>
              <p className="text-gray-400 text-sm">Vuelve pronto para leer nuevas publicaciones</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, i) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  {post.image_url ? (
                    <div className="aspect-[16/9] bg-gradient-to-br from-purple-100 to-cyan-100 overflow-hidden">
                      <img src={post.image_url.startsWith("http") ? post.image_url : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${post.image_url}`} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-[#8234FE]/10 to-[#26BEFE]/10 flex items-center justify-center">
                      <svg className="h-12 w-12 text-[#8234FE]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                      {post.author && (
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          <span className="font-medium text-gray-500">{post.author}</span>
                        </span>
                      )}
                      {post.published_at && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(post.published_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-[#161A3A] leading-snug line-clamp-2 group-hover:text-[#8234FE] transition-colors duration-300">{post.title}</h2>
                    {post.excerpt && <p className="text-sm text-gray-500 mt-2.5 leading-relaxed line-clamp-3">{post.excerpt}</p>}
                    <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#8234FE] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Leer más <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
