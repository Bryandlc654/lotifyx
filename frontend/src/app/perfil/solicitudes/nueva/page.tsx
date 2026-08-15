"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PerfilSidebar } from "@/components/layout/perfil-sidebar";
import {
  isAuthenticated, getProfile, removeTokens, getCategories, getCategoryFields,
  getRequest, createRequest, updateRequest, uploadImage, getImageUrl,
} from "@/lib/api";
import type { Category, CategoryField } from "@/lib/api";

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");

  const [userRole, setUserRole] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [fields, setFields] = useState<CategoryField[]>([]);

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [image, setImage] = useState("");
  const [precioMinimo, setPrecioMinimo] = useState("");
  const [precioMaximo, setPrecioMaximo] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then(d => setUserRole(d.user?.role?.name || ""))
      .catch(() => { removeTokens(); router.push("/"); });
    getCategories().then(cs => setCategories(cs.filter(c => c.status === "active")));
  }, [router]);

  useEffect(() => {
    if (!categoryId) { setFields([]); return; }
    getCategoryFields().then(fs => setFields(fs.filter(f => f.category_id === categoryId)));
  }, [categoryId]);

  useEffect(() => {
    if (!editingId) return;
    getRequest(editingId).then(r => {
      if (!r) return;
      setCategoryId(r.category_id);
      setTitle(r.title || "");
      setDescription(r.description || "");
      setForm((r.specifications || {}) as Record<string, string>);
      setImage(r.image || "");
      setPrecioMinimo(r.precio_minimo != null ? String(r.precio_minimo) : "");
      setPrecioMaximo(r.precio_maximo != null ? String(r.precio_maximo) : "");
      setCantidad(String(r.cantidad || 1));
      if (r.fecha_limite) setFechaLimite(new Date(r.fecha_limite).toISOString().slice(0, 16));
    });
  }, [editingId]);

  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  async function handleImage(file?: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImage(url);
    } catch { toast.error("Error al subir imagen"); }
    finally { setUploading(false); if (uploadRef.current) uploadRef.current.value = ""; }
  }

  function renderField(field: CategoryField) {
    const val = form[field.name] || "";
    const setVal = (v: string) => setForm(prev => ({ ...prev, [field.name]: v }));
    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id}>
            <label className="form-label">{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            <textarea value={val} onChange={e => setVal(e.target.value)} className="w-full form-input-custom" rows={3} />
          </div>
        );
      case "select":
        return (
          <div key={field.id}>
            <label className="form-label">{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            <select value={val} onChange={e => setVal(e.target.value)} className="w-full form-input-custom">
              <option value="">Seleccionar {field.label.toLowerCase()}</option>
              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        );
      case "number":
        return (
          <div key={field.id}>
            <label className="form-label">{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            <input type="number" value={val} onChange={e => setVal(e.target.value)} className="w-full form-input-custom" />
          </div>
        );
      case "image":
        return (
          <div key={field.id}>
            <label className="form-label">{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            {val ? (
              <div className="flex items-center gap-3">
                <img src={getImageUrl(val)} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                <button type="button" onClick={() => setVal("")} className="text-xs text-red-500 font-semibold">Quitar</button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try { const url = await uploadImage(f); setVal(url); } catch { toast.error("Error al subir imagen"); }
                }}
                className="text-sm text-gray-500"
              />
            )}
          </div>
        );
      default:
        return (
          <div key={field.id}>
            <label className="form-label">{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            <input type="text" value={val} onChange={e => setVal(e.target.value)} className="w-full form-input-custom" placeholder={`Ej: ${field.label}`} />
          </div>
        );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) { toast.error("Selecciona una categoría"); return; }
    if (!title.trim()) { toast.error("Escribe el título de lo que necesitas"); return; }
    setSaving(true);
    try {
      const payload: any = {
        category_id: categoryId,
        title: title.trim(),
        description: description || null,
        specifications: form,
        image: image || null,
        precio_minimo: precioMinimo !== "" ? parseFloat(precioMinimo) : null,
        precio_maximo: precioMaximo !== "" ? parseFloat(precioMaximo) : null,
        cantidad: cantidad !== "" ? parseInt(cantidad) || 1 : 1,
        fecha_limite: fechaLimite ? new Date(fechaLimite).toISOString() : null,
      };
      if (editingId) {
        await updateRequest(editingId, payload);
        toast.success("Solicitud actualizada");
      } else {
        await createRequest(payload);
        toast.success("Solicitud publicada. Los vendedores podrán ofertar.");
      }
      router.push("/perfil/solicitudes");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar la solicitud");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 md:px-8 pt-24 md:pt-40 pb-8 flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-12">
        <PerfilSidebar active="solicitudes" userRole={userRole} />
        <div className="max-w-3xl w-full">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <button onClick={() => router.push("/perfil/solicitudes")} className="text-slate-400 hover:text-slate-600">Mis Solicitudes</button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-semibold">{editingId ? "Editar solicitud" : "Nueva solicitud"}</span>
          </nav>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
            <h1 className="text-xl font-extrabold text-slate-900 mb-6">
              {editingId ? "Editar solicitud de compra" : "Publicar solicitud de compra"}
            </h1>

            <div className="mb-4">
              <label className="form-label">Categoría *</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full form-input-custom">
                <option value="">Selecciona la categoría de lo que necesitas</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label">Título de lo que necesitas *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full form-input-custom" placeholder="Ej: Necesito 500 cajas de cartón corrugado" />
            </div>

            <div className="mb-4">
              <label className="form-label">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full form-input-custom" rows={3} placeholder="Detalla lo que necesitas: uso, cantidad, plazos..." />
            </div>

            {categoryId && fields.length > 0 && (
              <div className="mb-4">
                <h3 className="form-label">Especificaciones de la categoría</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{fields.map(renderField)}</div>
              </div>
            )}

            <div className="mb-4">
              <label className="form-label">Imagen de referencia (opcional)</label>
              {image ? (
                <div className="flex items-center gap-3">
                  <img src={getImageUrl(image)} alt="" className="w-24 h-24 rounded-lg object-cover border border-gray-200" />
                  <div className="space-y-2">
                    <button type="button" onClick={() => setImage("")} className="text-xs text-red-500 font-semibold block">Quitar</button>
                    <input ref={uploadRef} type="file" accept="image/*" onChange={e => handleImage(e.target.files?.[0])} className="text-xs text-gray-400" />
                  </div>
                </div>
              ) : uploading ? (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                </div>
              ) : (
                <input ref={uploadRef} type="file" accept="image/*" onChange={e => handleImage(e.target.files?.[0])} className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="form-label">Precio mínimo (S/)</label>
                <input type="number" min="0" step="0.01" value={precioMinimo} onChange={e => setPrecioMinimo(e.target.value)} className="w-full form-input-custom" placeholder="0.00" />
              </div>
              <div>
                <label className="form-label">Precio máximo (S/)</label>
                <input type="number" min="0" step="0.01" value={precioMaximo} onChange={e => setPrecioMaximo(e.target.value)} className="w-full form-input-custom" placeholder="0.00" />
              </div>
              <div>
                <label className="form-label">Cantidad que necesitas</label>
                <input type="number" min="1" step="1" value={cantidad} onChange={e => setCantidad(e.target.value)} className="w-full form-input-custom" placeholder="1" />
              </div>
            </div>

            <div className="mb-6">
              <label className="form-label">Fecha límite para recibir ofertas</label>
              <input type="datetime-local" value={fechaLimite} onChange={e => setFechaLimite(e.target.value)} className="w-full form-input-custom" />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? "Guardar cambios" : "Publicar solicitud"}
              </button>
              <button type="button" onClick={() => router.push("/perfil/solicitudes")} className="text-sm text-slate-500 hover:text-slate-700 font-semibold">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
      <style>{`
        .form-label { font-size: 0.75rem; font-weight: 700; color: #4b5563; margin-bottom: 0.375rem; display: block; }
        .form-input-custom { font-size: 0.875rem; color: #374151; border-color: #d1d5db; border-radius: 0.5rem; border-width: 1px; padding: 0.5rem 0.75rem; }
        .form-input-custom:focus { outline: 2px solid #a855f7; border-color: transparent; }
      `}</style>
    </>
  );
}
