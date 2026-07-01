"use client";

import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getBanners, createBanner, deleteBanner, updateBanner, Banner } from "@/lib/api";
import { Plus, Trash2, Upload, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (err: any) {
      toast.error(err.message || "Error al cargar banners");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!title.trim()) {
      toast.error("Ingresa un título para el banner");
      return;
    }
    if (!selectedFile) {
      toast.error("Selecciona una imagen");
      return;
    }

    setUploading(true);
    try {
      await createBanner(title.trim(), selectedFile);
      toast.success("Banner creado exitosamente");
      setTitle("");
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      loadBanners();
    } catch (err: any) {
      toast.error(err.message || "Error al crear banner");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este banner?")) return;
    try {
      await deleteBanner(id);
      toast.success("Banner eliminado");
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    }
  }

  function startEdit(banner: Banner) {
    setEditingId(banner.id);
    setEditTitle(banner.title);
    setEditFile(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditFile(null);
  }

  async function handleUpdate(id: string) {
    if (!editTitle.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    try {
      await updateBanner(id, editTitle.trim(), editFile || undefined);
      toast.success("Banner actualizado");
      cancelEdit();
      loadBanners();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
            <p className="text-gray-500 text-sm mt-1">
              Gestiona las imágenes publicitarias del sitio
            </p>
          </div>
        </div>

        {/* Crear banner */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Nuevo banner
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del banner"
              className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
            <div className="flex flex-col gap-2">
              <div className="flex gap-3 items-start">
                <label className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                  selectedFile ? "border-primary-300 bg-primary-50 text-primary-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}>
                  <Upload className="h-4 w-4" />
                  {selectedFile ? selectedFile.name.slice(0, 20) + (selectedFile.name.length > 20 ? "..." : "") : "Seleccionar imagen"}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (!f) { setSelectedFile(null); return; }
                      const maxSize = 2 * 1024 * 1024;
                      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
                      if (!allowed.includes(f.type)) {
                        toast.error("Formato no válido. Usa JPG, PNG, WebP o GIF");
                        e.target.value = "";
                        setSelectedFile(null);
                        return;
                      }
                      if (f.size > maxSize) {
                        toast.error("La imagen supera los 2MB permitidos");
                        e.target.value = "";
                        setSelectedFile(null);
                        return;
                      }
                      setSelectedFile(f);
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {uploading ? "Subiendo..." : "Crear"}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 ml-1">
                Formatos: JPG, PNG, WebP, GIF — Máx. 2MB — Se recomienda 1920x400px
              </p>
            </div>
          </div>
        </div>

        {/* Lista de banners */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Banners ({banners.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : banners.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              No hay banners creados aún
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={banner.image_url.startsWith("http") ? banner.image_url : `${API_URL}${banner.image_url}`}
                    alt={banner.title}
                    className="w-24 h-16 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                  />

                  {editingId === banner.id ? (
                    /* Edit mode */
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                      />
                      <label className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${editFile ? "border-primary-300 bg-primary-50 text-primary-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                        <Upload className="h-3.5 w-3.5" />
                        {editFile ? editFile.name.slice(0, 16) + (editFile.name.length > 16 ? "..." : "") : "Imagen"}
                        <input
                          ref={editFileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) { setEditFile(null); return; }
                            const maxSize = 2 * 1024 * 1024;
                            const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
                            if (!allowed.includes(f.type)) {
                              toast.error("Formato no válido. Usa JPG, PNG, WebP o GIF");
                              e.target.value = "";
                              setEditFile(null);
                              return;
                            }
                            if (f.size > maxSize) {
                              toast.error("La imagen supera los 2MB permitidos");
                              e.target.value = "";
                              setEditFile(null);
                              return;
                            }
                            setEditFile(f);
                          }}
                        />
                      </label>
                      <button
                        onClick={() => handleUpdate(banner.id)}
                        disabled={saving}
                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    /* View mode */
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {banner.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(banner.created_at).toLocaleDateString("es-PE")}
                          {banner.is_active ? " · Activo" : " · Inactivo"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEdit(banner)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition-colors flex-shrink-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(banner.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
