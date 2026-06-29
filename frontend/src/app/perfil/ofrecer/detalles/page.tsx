"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getCategoryFields, getProfile, isAuthenticated, removeTokens, CategoryField, uploadGallery, uploadImage, getImageUrl, createProduct, getProduct, updateProduct } from "@/lib/api";
import { toast } from "sonner";

function DetallesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoria") || "";
  const categoryName = searchParams.get("nombre") || "";

  const editingId = searchParams.get("id") || "";
  const isEditing = !!editingId;

  const [userRole, setUserRole] = useState("");
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<"especificaciones" | "condiciones">("especificaciones");
  const [conditions, setConditions] = useState({
    metodo_pago: "",
    envio_delivery: false,
    envio_courier: false,
    costo_envio: "",
    tiempo_entrega: "",
    cambios: "",
    devoluciones: "",
    garantia: "",
    politicas_imagenes: "",
  });

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    if (!categoryId) { router.push("/perfil/ofrecer"); return; }

    getProfile()
      .then((data) => {
        const u = data.user as any;
        const role = u.role?.name || "";
        setUserRole(role);
        if (role === "superadmin") { router.push("/perfil"); return; }
      })
      .catch(() => { removeTokens(); router.push("/"); });

    const loadFields = getCategoryFields(categoryId)
      .then((catFields) => {
        setFields(catFields);
        const initial: Record<string, string> = {};
        catFields.forEach(f => { initial[f.name] = ""; });
        return initial;
      })
      .catch(() => { toast.error("Error al cargar campos"); return {} as Record<string, string>; });

    if (editingId) {
      Promise.all([loadFields, getProduct(editingId)])
        .then(([_, p]) => {
          const specForm: Record<string, string> = {};
          Object.entries(p.specifications || {}).forEach(([k, v]) => { specForm[k] = String(v ?? ""); });
          setForm(specForm);
          setConditions({
            metodo_pago: p.metodo_pago || "",
            envio_delivery: p.envio_delivery,
            envio_courier: p.envio_courier,
            costo_envio: String(p.costo_envio || ""),
            tiempo_entrega: p.tiempo_entrega || "",
            cambios: p.cambios || "",
            devoluciones: p.devoluciones || "",
            garantia: p.garantia || "",
            politicas_imagenes: p.politicas_imagenes || "",
          });
        })
        .catch(() => toast.error("Error al cargar producto"))
        .finally(() => setLoading(false));
    } else {
      loadFields.finally(() => setLoading(false));
    }
  }, [categoryId, editingId, router]);

  function GalleryUpload({ urls, onChange }: { urls: string[]; onChange: (urls: string[]) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
        const newUrls = await uploadGallery(files);
        onChange([...urls, ...newUrls]);
      } catch { toast.error("Error al subir imágenes"); }
      finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
    }

    return (
      <div>
        <div className="flex flex-wrap gap-2 mb-2">
          {urls.map((url, i) => (
            <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
              <img src={getImageUrl(url)} alt={`${i + 1}`} className="w-full h-full object-cover" />
              <button type="button" onClick={() => onChange(urls.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                X
              </button>
            </div>
          ))}
          {uploading && (
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFiles}
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
      </div>
    );
  }

  function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const url = await uploadImage(file);
        onChange(url);
      } catch { toast.error("Error al subir imagen"); }
      finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
    }

    return (
      <div>
        {value && (
          <div className="relative inline-block mb-2 w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
            <img src={getImageUrl(value)} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange("")}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">X</button>
          </div>
        )}
        {uploading ? (
          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : (
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
        )}
      </div>
    );
  }

  function renderField(field: CategoryField) {
    const val = form[field.name] || "";
    const setVal = (v: string) => setForm(prev => ({ ...prev, [field.name]: v }));

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id}>
            <label className="form-label" htmlFor={field.name}>{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            <textarea id={field.name} value={val} onChange={e => setVal(e.target.value)}
              className="w-full form-input-custom focus:ring-purple-500" rows={3} />
          </div>
        );
      case "select":
        return (
          <div key={field.id}>
            <label className="form-label" htmlFor={field.name}>{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            <select id={field.name} value={val} onChange={e => setVal(e.target.value)}
              className="w-full form-input-custom focus:ring-purple-500">
              <option value="">Seleccionar {field.label.toLowerCase()}</option>
              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        );
      case "number":
        return (
          <div key={field.id}>
            <label className="form-label" htmlFor={field.name}>{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            <input id={field.name} type="number" value={val} onChange={e => setVal(e.target.value)}
              className="w-full form-input-custom focus:ring-purple-500" />
          </div>
        );
      case "gallery":
        return (
          <div key={field.id} className="md:col-span-2">
            <label className="form-label">{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            <GalleryUpload urls={val ? JSON.parse(val) : []} onChange={(urls) => setVal(JSON.stringify(urls))} />
          </div>
        );
      case "image":
        return (
          <div key={field.id}>
            <label className="form-label" htmlFor={field.name}>{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            <ImageUpload value={val} onChange={setVal} />
          </div>
        );
      default:
        return (
          <div key={field.id}>
            <label className="form-label" htmlFor={field.name}>{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            <input id={field.name} type="text" value={val} onChange={e => setVal(e.target.value)}
              className="w-full form-input-custom focus:ring-purple-500" placeholder={`Ej: ${field.label}`} />
          </div>
        );
    }
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const titleKey = Object.keys(form).find(k => /t[ií]tulo|title|nombre/i.test(k));
      const title = titleKey ? form[titleKey] : categoryName;
      const payload = {
        category_id: categoryId,
        title,
        specifications: form,
        ...conditions,
        costo_envio: parseFloat(conditions.costo_envio) || 0,
      };
      if (isEditing) {
        await updateProduct(editingId, payload);
        toast.success("Producto actualizado con éxito");
      } else {
        await createProduct(payload);
        toast.success("Producto creado con éxito");
      }
      router.push("/perfil/mis-productos");
    } catch (e: any) {
      toast.error(e.message || "Error al guardar producto");
    } finally {
      setSaving(false);
    }
  }

  if (!categoryId || loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 md:px-8 pt-24 md:pt-40 pb-8 flex items-start justify-center gap-32">
        <nav className="w-44 flex-shrink-0 pt-8 space-y-1">
          <button onClick={() => router.push("/perfil")}
            className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
            Editar Perfil
          </button>
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/dashboard")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Dashboard
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-compras")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Compras
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-cuentas")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Cuentas
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-ventas")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Ventas
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/carga-masiva")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Carga Masiva
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-productos")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Productos
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/ofrecer")}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 border-l-2 border-slate-700 -ml-px">
              Ofrecer
            </button>
          )}
        </nav>
        <div className="max-w-4xl w-full">
          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Step progress */}
            <nav className="flex border-b border-gray-100 px-6 pt-4">
              <span className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
                activeSection === "especificaciones"
                  ? "text-purple-600 border-purple-600"
                  : "text-gray-300 border-transparent"
              }`}>
                1. Especificaciones
              </span>
              <span className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
                activeSection === "condiciones"
                  ? "text-purple-600 border-purple-600"
                  : "text-gray-300 border-transparent"
              }`}>
                2. Condiciones de venta
              </span>
            </nav>

            <div className="p-6 md:p-8 space-y-6">
              {activeSection === "especificaciones" && (
                <>
                  {fields.length > 0 && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.filter(f => f.type !== "textarea").map(renderField)}
                      </div>
                      <div className="mt-4">
                        {fields.filter(f => f.type === "textarea").map(renderField)}
                      </div>
                    </div>
                  )}
                  {fields.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">No hay campos configurados para esta categoría</p>
                  )}
                </>
              )}

              {activeSection === "condiciones" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                    <label className="form-label pt-2">Método de pago</label>
                    <select value={conditions.metodo_pago} onChange={e => setConditions({ ...conditions, metodo_pago: e.target.value })}
                      className="w-full form-input-custom focus:ring-purple-500">
                      <option value="">Seleccionar método de pago</option>
                      <option value="plataforma">Plataforma</option>
                      <option value="subasta">Subasta</option>
                      <option value="venta_por_lote">Venta por lote</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                    <label className="form-label pt-2">Envío</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={conditions.envio_delivery} onChange={e => setConditions({ ...conditions, envio_delivery: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                        <span className="text-sm text-gray-700">Delivery propio</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={conditions.envio_courier} onChange={e => setConditions({ ...conditions, envio_courier: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                        <span className="text-sm text-gray-700">Courier externo</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                    <label className="form-label pt-2">Costo de envío</label>
                    <input type="number" value={conditions.costo_envio} onChange={e => setConditions({ ...conditions, costo_envio: e.target.value })}
                      className="w-full form-input-custom focus:ring-purple-500 max-w-xs" placeholder="0.00" />
                  </div>

                  <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                    <label className="form-label pt-2">Tiempo de entrega</label>
                    <input type="text" value={conditions.tiempo_entrega} onChange={e => setConditions({ ...conditions, tiempo_entrega: e.target.value })}
                      className="w-full form-input-custom focus:ring-purple-500 max-w-xs" placeholder="Ej: 3-5 días hábiles" />
                  </div>

                  <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                    <label className="form-label pt-2">Cambios</label>
                    <textarea value={conditions.cambios} onChange={e => setConditions({ ...conditions, cambios: e.target.value })}
                      className="w-full form-input-custom focus:ring-purple-500" rows={3} placeholder="Describe la política de cambios" />
                  </div>

                  <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                    <label className="form-label pt-2">Devoluciones</label>
                    <textarea value={conditions.devoluciones} onChange={e => setConditions({ ...conditions, devoluciones: e.target.value })}
                      className="w-full form-input-custom focus:ring-purple-500" rows={3} placeholder="Describe la política de devoluciones" />
                  </div>

                  <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                    <label className="form-label pt-2">Garantía</label>
                    <textarea value={conditions.garantia} onChange={e => setConditions({ ...conditions, garantia: e.target.value })}
                      className="w-full form-input-custom focus:ring-purple-500" rows={3} placeholder="Describe la garantía" />
                  </div>

                  <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                    <label className="form-label pt-2">Políticas de imágenes</label>
                    <textarea value={conditions.politicas_imagenes} onChange={e => setConditions({ ...conditions, politicas_imagenes: e.target.value })}
                      className="w-full form-input-custom focus:ring-purple-500" rows={3} placeholder="Describe las políticas de uso de imágenes" />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-4 pt-4">
                {activeSection === "especificaciones" ? (
                  <button type="button" onClick={() => {
                    const required = fields.filter(f => f.required);
                    const missing = required.filter(f => !form[f.name]?.trim());
                    if (missing.length > 0) {
                      toast.error(`Completa los campos obligatorios: ${missing.map(f => f.label).join(", ")}`);
                      return;
                    }
                    setActiveSection("condiciones");
                  }}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:opacity-90 transition-opacity">
                    Siguiente
                  </button>
                ) : (
                  <button type="button" disabled={saving} onClick={handleSubmit}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:opacity-90 transition-opacity disabled:opacity-60">
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                )}
                {activeSection === "condiciones" && (
                  <button type="button" onClick={() => setActiveSection("especificaciones")}
                    className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors">
                    Anterior
                  </button>
                )}
                <button type="button" onClick={() => router.push("/perfil/ofrecer")}
                  className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .form-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #4b5563;
          margin-bottom: 0.375rem;
          display: block;
        }
        .form-input-custom {
          font-size: 0.875rem;
          color: #374151;
          border-color: #d1d5db;
          border-radius: 0.5rem;
          border-width: 1px;
          padding: 0.5rem 0.75rem;
        }
        .form-input-custom:focus {
          outline: 2px solid #a855f7;
          border-color: transparent;
        }
      `}</style>
    </>
  );
}

export default function DetallesPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </main>
    }>
      <DetallesContent />
    </Suspense>
  );
}
