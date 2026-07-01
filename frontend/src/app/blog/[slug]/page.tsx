"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getBlogPost, BlogPost } from "@/lib/api";
import { Calendar, User, ChevronDown, Loader2, ArrowLeft } from "lucide-react";

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    getBlogPost(slug as string).then(setPost).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-24 min-h-screen bg-[#f5f6f8] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </main>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="pt-24 min-h-screen bg-[#f5f6f8] flex flex-col items-center justify-center gap-4">
          <p className="text-gray-500 text-lg">Artículo no encontrado</p>
          <Link href="/blog" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all">
            <ArrowLeft className="h-4 w-4" /> Volver al blog
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-[#f5f6f8]">
        <article className="max-w-3xl mx-auto px-6 py-12">
          {/* Back link */}
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#8234FE] transition-colors mb-8 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Volver al blog
          </Link>

          {/* Header meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
            {post.author && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
                <User className="h-3.5 w-3.5" />
                {post.author}
              </span>
            )}
            {post.published_at && (
              <span className="inline-flex items-center gap-1.5 text-gray-400">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.published_at).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-[#161A3A] leading-tight mb-8">{post.title}</h1>

          {/* Featured image */}
          {post.image_url && (
            <div className="rounded-2xl overflow-hidden mb-10 shadow-sm">
              <img src={post.image_url.startsWith("http") ? post.image_url : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${post.image_url}`} alt={post.title} className="w-full aspect-video object-cover" />
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
            <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#161A3A] [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#161A3A] [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#161A3A] [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:mb-4 [&_p]:leading-relaxed [&_img]:rounded-xl [&_img]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#8234FE] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_blockquote]:my-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_a]:text-[#8234FE] [&_a]:underline [&_a]:hover:no-underline [&_pre]:bg-gray-50 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-6 [&_pre]:text-sm [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0"
              dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* Bottom navigation */}
          <div className="mt-10 flex justify-center">
            <Link href="/blog" className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 hover:border-[#8234FE] hover:text-[#8234FE] transition-all">
              <ArrowLeft className="h-4 w-4" />
              Ver más artículos
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
