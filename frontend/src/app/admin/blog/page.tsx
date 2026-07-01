"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, BlogPost } from "@/lib/api";
import { Plus, Pencil, Trash2, Eye, X, EyeOff, Check, XCircle } from "lucide-react";
import { toast } from "sonner";

const QuillEditor = dynamic(() => import("react-quill").then(m => m.default), { ssr: false });
import "react-quill/dist/quill.snow.css";

const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link", "image", "blockquote"],
  [{ align: [] }],
  ["clean"],
];

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; post?: BlogPost }>({ open: false });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content: "", author: "", image_url: "", status: "draft" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setPosts(await getAdminBlogPosts());
    } catch { toast.error("Error al cargar artículos"); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setForm({ title: "", slug: "", excerpt: "", content: "", author: "", image_url: "", status: "draft" });
    setModal({ open: true });
  }

  function openEdit(post: BlogPost) {
    setForm({ title: post.title, slug: post.slug, excerpt: post.excerpt || "", content: post.content, author: post.author || "", image_url: post.image_url || "", status: post.status });
    setModal({ open: true, post });
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error("El título es obligatorio"); return; }
    if (!form.content.trim()) { toast.error("El contenido es obligatorio"); return; }
    setSaving(true);
    try {
      if (modal.post) {
        await updateBlogPost(modal.post.id, form);
        toast.success("Artículo actualizado");
      } else {
        await createBlogPost(form);
        toast.success("Artículo creado");
      }
      setModal({ open: false });
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este artículo?")) return;
    try { await deleteBlogPost(id); toast.success("Artículo eliminado"); load(); }
    catch { toast.error("Error al eliminar"); }
  }

  async function handleToggleStatus(post: BlogPost) {
    const newStatus = post.status === "published" ? "draft" : "published";
    try { await updateBlogPost(post.id, { status: newStatus }); load(); }
    catch { toast.error("Error al cambiar estado"); }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("lotifyx_access");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/uploads/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      setForm(f => ({ ...f, image_url: data.url }));
    } catch { toast.error("Error al subir imagen"); }
    finally { setUploadingImage(false); }
  }

  const statusColor: Record<string, string> = {
    published: "bg-green-50 text-green-700",
    draft: "bg-gray-100 text-gray-600",
    hidden: "bg-red-50 text-red-600",
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-4 py-2 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm">
            <Plus className="h-4 w-4" /> Nuevo artículo
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" /></div>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No hay artículos aún</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Título</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Autor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {posts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900 text-sm truncate max-w-[300px]">{p.title}</p>
                      {p.slug && <p className="text-[10px] text-gray-400 font-mono mt-0.5">/{p.slug}</p>}
                    </td>
                    <td className="px-3 py-3 text-center hidden sm:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[p.status] || "bg-gray-100 text-gray-600"}`}>
                        {p.status === "published" ? "Publicado" : p.status === "draft" ? "Borrador" : "Oculto"}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell"><span className="text-sm text-gray-500">{p.author || "—"}</span></td>
                    <td className="px-5 py-3 hidden lg:table-cell text-sm text-gray-400">
                      {new Date(p.created_at).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleToggleStatus(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title={p.status === "published" ? "Ocultar" : "Publicar"}>
                          {p.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 pt-12 overflow-y-auto" onClick={() => setModal({ open: false })}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-base">{modal.post ? "Editar artículo" : "Nuevo artículo"}</h2>
              <button onClick={() => setModal({ open: false })} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Título *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Título del artículo"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
              </div>

              {/* Slug + Author + Status */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Slug</label>
                  <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="url-del-articulo"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Autor</label>
                  <input type="text" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                    placeholder="Autor"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500">
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                  </select>
                </div>
              </div>

              {/* Excerpt */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Extracto</label>
                <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                  placeholder="Breve descripción del artículo..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 resize-none" />
              </div>

              {/* Image */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Imagen destacada</label>
                <div className="flex items-center gap-3">
                  <input type="text" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                    placeholder="URL de la imagen..."
                    className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
                  <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    {uploadingImage ? "Subiendo..." : "Subir"}
                  </label>
                </div>
                {form.image_url && (
                  <img src={form.image_url.startsWith("http") ? form.image_url : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${form.image_url}`} alt="" className="mt-2 h-32 w-full object-cover rounded-lg border" />
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Contenido *</label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <QuillEditor value={form.content} onChange={v => setForm(f => ({ ...f, content: v }))}
                    modules={{ toolbar: toolbarOptions }}
                    className="h-64" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setModal({ open: false })} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm disabled:opacity-60">
                {saving ? "Guardando..." : <><Check className="h-4 w-4" /> {modal.post ? "Actualizar" : "Publicar"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
