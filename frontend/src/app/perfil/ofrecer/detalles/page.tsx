"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { MessageCircle, Wallet } from "lucide-react";
import { getCategoryFields, getProfile, isAuthenticated, removeTokens, CategoryField, uploadGallery, uploadImage, getImageUrl, createProduct, getMyProduct, updateProduct } from "@/lib/api";
import { getLotByProduct, saveLotPricing, RcgTier } from "@/lib/api";
import { toast } from "sonner";
import { PerfilSidebar } from "@/components/layout/perfil-sidebar";

function toDatetimeLocal(value: any): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
    stock: "",
    precio_base: "",
    precio_inicial: "",
    incremento_minimo: "",
    cierre_estimado: "",
    precio_lote: "",
    precio_individual: "",
    participantes_minimos: "",
    cmc: "",
    min_qty: "",
    cantidad_total: "",
    envio_delivery: false,
    envio_courier: false,
    costo_envio: "",
    tiempo_entrega: "",
    cambios: "",
    devoluciones: "",
    garantia: "",
    politicas_imagenes: "",
  });
  const [tiers, setTiers] = useState<RcgTier[]>([]);
  const [metaVenta, setMetaVenta] = useState("");

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
      Promise.all([loadFields, getMyProduct(editingId)])
        .then(([_, p]) => {
          const specForm: Record<string, string> = {};
          Object.entries(p.specifications || {}).forEach(([k, v]) => { specForm[k] = String(v ?? ""); });
          const specStock = specForm["Stock"] ?? specForm["stock"] ?? "";
          const stockVal = p.stock != null && String(p.stock) !== "" ? String(p.stock) : specStock;
          if (specStock !== "") {
            const stockKey = specForm["Stock"] !== undefined ? "Stock" : "stock";
            specForm[stockKey] = stockVal;
          }
          setForm(specForm);
          setConditions({
            metodo_pago: p.metodo_pago || "",
            stock: stockVal,
            precio_base: String(p.precio_base ?? (p.metodo_pago === "subasta" ? p.precio_inicial ?? "" : "")),
            precio_inicial: String(p.precio_inicial ?? ""),
            incremento_minimo: String(p.incremento_minimo ?? ""),
            cierre_estimado: toDatetimeLocal(p.cierre_estimado),
            precio_lote: String(p.precio_lote ?? ""),
            precio_individual: String(p.precio_individual ?? ""),
            participantes_minimos: String(p.participantes_minimos ?? ""),
            cmc: String(p.cmc ?? ""),
            min_qty: String(p.min_qty ?? ""),
            cantidad_total: String(p.cantidad_total ?? ""),
            envio_delivery: p.envio_delivery,
            envio_courier: p.envio_courier,
            costo_envio: String(p.costo_envio || ""),
            tiempo_entrega: p.tiempo_entrega || "",
            cambios: p.cambios || "",
            devoluciones: p.devoluciones || "",
            garantia: p.garantia || "",
            politicas_imagenes: p.politicas_imagenes || "",
          });
          if (p.metodo_pago === "venta_por_lote") {
            getLotByProduct(editingId)
              .then(lot => {
                if (lot) {
                  setTiers((lot.rcg_tiers || []).map(t => ({ ...t })));
                  if (lot.meta_venta != null) setMetaVenta(String(lot.meta_venta));
                }
              })
              .catch(() => {});
          }
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

  const isLot = conditions.metodo_pago === "venta_por_lote";
  const specPriceKey = Object.keys(form).find(k => /precio/i.test(k));
  const specPriceValue = specPriceKey ? form[specPriceKey] : "";
  const lotTotalRaw = conditions.precio_lote !== "" ? conditions.precio_lote : specPriceValue;
  const lotTotal = isLot && lotTotalRaw !== "" ? parseFloat(lotTotalRaw) || 0 : 0;
  const lotStock = isLot && conditions.stock !== "" ? parseInt(conditions.stock) || 0 : 0;
  const lotUnitPrice = lotStock > 0 ? lotTotal / lotStock : 0;

  function renderField(field: CategoryField) {
    const val = form[field.name] || "";
    const setVal = (v: string) => setForm(prev => ({ ...prev, [field.name]: v }));

    if (/stock|cantidad|unidades/i.test(field.name) || /stock|cantidad|unidades/i.test(field.label)) {
      return (
        <div key={field.id}>
          <label className="form-label" htmlFor={field.name}>{field.label}</label>
          <input id={field.name} type="number" min="0" value={conditions.stock}
            onChange={e => {
              const v = e.target.value;
              setConditions({ ...conditions, stock: v });
              setForm(prev => ({ ...prev, [field.name]: v }));
            }}
            className="w-full form-input-custom focus:ring-purple-500" placeholder="0" />
        </div>
      );
    }

    if (isLot && /precio/i.test(field.name)) {
      const display = conditions.precio_lote !== "" ? conditions.precio_lote : val;
      return (
        <div key={field.id}>
          <label className="form-label" htmlFor={field.name}>{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
          <input id={field.name} type="number" min="0" value={display}
            onChange={e => {
              const v = e.target.value;
              setConditions({ ...conditions, precio_lote: v });
              setForm(prev => ({ ...prev, [field.name]: v }));
            }}
            className="w-full form-input-custom focus:ring-purple-500" placeholder="0.00" />
          <p className="text-xs text-gray-400 mt-1">Precio total del lote</p>
        </div>
      );
    }

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
      const payload: any = {
        category_id: categoryId,
        title,
        specifications: form,
        ...conditions,
        stock: conditions.stock !== "" ? parseInt(conditions.stock) || 0 : 0,
        costo_envio: parseFloat(conditions.costo_envio) || 0,
        precio_base: conditions.precio_base ? parseFloat(conditions.precio_base) : undefined,
        precio_inicial: conditions.metodo_pago === "subasta" && conditions.precio_base
          ? parseFloat(conditions.precio_base) : undefined,
        cierre_estimado: conditions.cierre_estimado
          ? new Date(conditions.cierre_estimado).toISOString() : undefined,
        incremento_minimo: conditions.incremento_minimo ? parseFloat(conditions.incremento_minimo) : undefined,
        precio_lote: isLot
          ? (lotTotal > 0 ? lotTotal : undefined)
          : (conditions.precio_lote ? parseFloat(conditions.precio_lote) : undefined),
        precio_individual: isLot
          ? (lotUnitPrice > 0 ? Number(lotUnitPrice.toFixed(2)) : undefined)
          : (conditions.precio_individual ? parseFloat(conditions.precio_individual) : undefined),
        participantes_minimos: conditions.participantes_minimos ? parseInt(conditions.participantes_minimos) : undefined,
        cmc: conditions.cmc ? parseInt(conditions.cmc) : undefined,
        min_qty: conditions.metodo_pago === "plataforma" && conditions.min_qty ? parseInt(conditions.min_qty) : undefined,
        cantidad_total: isLot
          ? (lotStock > 0 ? lotStock : undefined)
          : (conditions.cantidad_total ? parseInt(conditions.cantidad_total) : undefined),
      };
      let savedId = editingId;
      if (isEditing) {
        await updateProduct(editingId, payload);
        toast.success("Producto actualizado con éxito");
      } else {
        const created = await createProduct(payload);
        savedId = created?.id || "";
        toast.success("Producto creado con éxito");
      }
      if (isLot && savedId) {
        try {
          const lot = await getLotByProduct(savedId);
          if (lot) {
            const cleanTiers = tiers
              .filter(t => t.desde != null)
              .map(t => ({
                desde: Number(t.desde) || 1,
                hasta: t.hasta != null ? Number(t.hasta) : null,
                tipo_beneficio: t.tipo_beneficio || "descuento",
                valor: Number(t.valor) || 0,
                activacion: t.activacion || "al_cierre",
                descripcion: t.descripcion || null,
              }));
            await saveLotPricing(lot.id, cleanTiers, metaVenta !== "" ? Number(metaVenta) : null);
          }
        } catch {
          toast.error("Producto guardado, pero no se pudieron guardar los rangos");
        }
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
      <main className="min-h-screen bg-gray-50 px-4 md:px-8 pt-24 md:pt-40 pb-8 flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-12">
        <PerfilSidebar active="ofrecer" userRole={userRole} />
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
                    <label className="form-label pt-2">Cantidad en stock</label>
                    <input type="number" min="0" value={conditions.stock} onChange={e => setConditions({ ...conditions, stock: e.target.value })}
                      className="w-full form-input-custom focus:ring-purple-500 max-w-xs" placeholder="0" />
                  </div>

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

                  {/* Venta directa divisible: CMC = cantidad mínima por pedido */}
                  {conditions.metodo_pago === "plataforma" && (
                    <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                      <label className="form-label pt-2">CMC por pedido (mín.)</label>
                      <div>
                        <input type="number" value={conditions.min_qty} onChange={e => setConditions({ ...conditions, min_qty: e.target.value })}
                          className="w-full form-input-custom focus:ring-purple-500 max-w-xs" placeholder="1" />
                        <p className="text-xs text-gray-400 mt-1">Cantidad mínima de unidades que debe comprar cada cliente por pedido.</p>
                      </div>
                    </div>
                  )}

                  {/* Auction fields */}
                  {conditions.metodo_pago === "subasta" && (
                    <>
                      <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                        <label className="form-label pt-2">Precio base</label>
                        <input type="number" step="0.01" value={conditions.precio_base} onChange={e => setConditions({ ...conditions, precio_base: e.target.value })}
                          className="w-full form-input-custom focus:ring-purple-500 max-w-xs" placeholder="0.00" />
                      </div>
                      <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                        <label className="form-label pt-2">Incremento mínimo</label>
                        <input type="number" step="0.01" value={conditions.incremento_minimo} onChange={e => setConditions({ ...conditions, incremento_minimo: e.target.value })}
                          className="w-full form-input-custom focus:ring-purple-500 max-w-xs" placeholder="1.00" />
                      </div>
                      <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                        <label className="form-label pt-2">Cierre de subasta</label>
                        <input type="datetime-local" value={conditions.cierre_estimado} onChange={e => setConditions({ ...conditions, cierre_estimado: e.target.value })}
                          className="w-full form-input-custom focus:ring-purple-500 max-w-xs" />
                      </div>
                    </>
                  )}

                  {/* Venta por lote fields */}
                  {conditions.metodo_pago === "venta_por_lote" && (
                    <>
                      <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                        <label className="form-label pt-2">Precio por lote</label>
                        <div>
                          <input type="number" step="0.01" readOnly value={lotTotal > 0 ? lotTotal : ""}
                            className="w-full form-input-custom focus:ring-purple-500 max-w-xs bg-gray-50 text-gray-600" placeholder="0.00" />
                          <p className="text-xs text-gray-400 mt-1">Se toma del precio ingresado en las especificaciones.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                        <label className="form-label pt-2">Precio individual</label>
                        <div>
                          <input type="number" step="0.01" readOnly value={lotUnitPrice > 0 ? Number(lotUnitPrice.toFixed(2)) : ""}
                            className="w-full form-input-custom focus:ring-purple-500 max-w-xs bg-gray-50 text-gray-600" placeholder="0.00" />
                          <p className="text-xs text-gray-400 mt-1">Calculado automáticamente: precio por lote ÷ cantidad en stock.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                        <label className="form-label pt-2">Cantidad total de unidades</label>
                        <div>
                          <input type="number" readOnly value={lotStock > 0 ? lotStock : ""}
                            className="w-full form-input-custom focus:ring-purple-500 max-w-xs bg-gray-50 text-gray-600" placeholder="0" />
                          <p className="text-xs text-gray-400 mt-1">Es igual a la cantidad en stock.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                        <label className="form-label pt-2">Mínimo de unidades para cerrar</label>
                        <input type="number" value={conditions.participantes_minimos} onChange={e => setConditions({ ...conditions, participantes_minimos: e.target.value })}
                          className="w-full form-input-custom focus:ring-purple-500 max-w-xs" placeholder="1" />
                      </div>
                      <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                        <label className="form-label pt-2">CMC por comprador (mín.)</label>
                        <div>
                          <input type="number" value={conditions.cmc} onChange={e => setConditions({ ...conditions, cmc: e.target.value })}
                            className="w-full form-input-custom focus:ring-purple-500 max-w-xs" placeholder="1" />
                          <p className="text-xs text-gray-400 mt-1">Cantidad mínima de unidades que cada comprador debe comprometer.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                        <label className="form-label pt-2">Cierre de convocatoria</label>
                        <input type="datetime-local" value={conditions.cierre_estimado} onChange={e => setConditions({ ...conditions, cierre_estimado: e.target.value })}
                          className="w-full form-input-custom focus:ring-purple-500 max-w-xs" />
                      </div>

                      <div className="border-t border-gray-100 pt-5 mt-2">
                        <label className="text-sm font-bold text-gray-800 block mb-1">Incentivos y rangos de compra (RCG)</label>
                        <p className="text-xs text-gray-400 mb-4">
                          Define rangos sobre las unidades comprometidas en total. Cuando el lote alcanza un rango se activa <strong>un beneficio</strong>.
                          Pueden activarse al alcanzar el CMC individual, al cerrar el lote o al superar la meta de venta.
                        </p>

                        <div className="grid grid-cols-[180px_1fr] gap-4 items-start mb-4">
                          <label className="form-label pt-2">Meta de venta (expectativa)</label>
                          <div>
                            <input type="number" value={metaVenta} onChange={e => setMetaVenta(e.target.value)}
                              className="w-full form-input-custom focus:ring-purple-500 max-w-xs" placeholder="Por defecto: cantidad total" />
                            <p className="text-xs text-gray-400 mt-1">Unidades que, al superarse, activan los beneficios "Al superar expectativa".</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {tiers.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
                              Aún no has configurado rangos. Agrega el primero.
                            </p>
                          )}
                          {tiers.map((t, idx) => (
                            <div key={idx} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rango {idx + 1}</span>
                                <button type="button" onClick={() => setTiers(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-xs text-red-500 hover:text-red-700 font-medium">Quitar</button>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div>
                                  <label className="form-label">Desde</label>
                                  <input type="number" value={t.desde} onChange={e => setTiers(prev => prev.map((x, i) => i === idx ? { ...x, desde: Number(e.target.value) } : x))}
                                    className="w-full form-input-custom focus:ring-purple-500" placeholder="1" />
                                </div>
                                <div>
                                  <label className="form-label">Hasta</label>
                                  <input type="number" value={t.hasta ?? ""} onChange={e => setTiers(prev => prev.map((x, i) => i === idx ? { ...x, hasta: e.target.value !== "" ? Number(e.target.value) : null } : x))}
                                    className="w-full form-input-custom focus:ring-purple-500" placeholder="Sin límite" />
                                </div>
                                <div className="col-span-2">
                                  <label className="form-label">Activación</label>
                                  <select value={t.activacion} onChange={e => setTiers(prev => prev.map((x, i) => i === idx ? { ...x, activacion: e.target.value } : x))}
                                    className="w-full form-input-custom focus:ring-purple-500">
                                    <option value="al_cmc">Al alcanzar CMC (por comprador)</option>
                                    <option value="al_cierre">Al cerrar lote</option>
                                    <option value="superar_expectativa">Al superar expectativa</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="form-label">Beneficio</label>
                                  <select value={t.tipo_beneficio} onChange={e => setTiers(prev => prev.map((x, i) => i === idx ? { ...x, tipo_beneficio: e.target.value } : x))}
                                    className="w-full form-input-custom focus:ring-purple-500">
                                    <option value="precio">Precio (S/)</option>
                                    <option value="descuento">Descuento (%)</option>
                                    <option value="flete">Flete (S/)</option>
                                    <option value="unidades_extra">Unidades extra</option>
                                    <option value="destaque">Destacar compra</option>
                                    <option value="otro">Otro</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="form-label">Valor</label>
                                  <input type="number" step="0.01" value={t.valor} onChange={e => setTiers(prev => prev.map((x, i) => i === idx ? { ...x, valor: Number(e.target.value) } : x))}
                                    className="w-full form-input-custom focus:ring-purple-500" placeholder={t.tipo_beneficio === "descuento" || t.tipo_beneficio === "cashback" ? "5" : t.tipo_beneficio === "unidades_extra" ? "2" : "0.00"} />
                                </div>
                              </div>
                              <div>
                                <label className="form-label">Descripción para el comprador</label>
                                <input type="text" value={t.descripcion || ""} onChange={e => setTiers(prev => prev.map((x, i) => i === idx ? { ...x, descripcion: e.target.value } : x))}
                                  className="w-full form-input-custom focus:ring-purple-500" placeholder={t.tipo_beneficio === "otro" ? "Ej: Regalo sorpresa al unirte" : "Ej: Descuento del 5% por unidad"} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => setTiers(prev => [...prev, {
                          desde: prev.length > 0 ? Math.max(1, prev[prev.length - 1].desde) + 1 : 1,
                          hasta: null,
                          tipo_beneficio: "descuento",
                          valor: 5,
                          activacion: "al_cierre",
                          descripcion: "",
                        }])}
                          className="mt-3 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                          + Agregar rango
                        </button>
                      </div>
                    </>
                  )}

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

