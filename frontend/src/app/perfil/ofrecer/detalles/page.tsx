"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { MessageCircle, Wallet } from "lucide-react";
import { getCategoryFields, getProfile, isAuthenticated, removeTokens, CategoryField, uploadGallery, uploadImage, getImageUrl, createProduct, getMyProduct, updateProduct, getCategories, getVerification, submitVerification, uploadVideo, uploadFile, getProductVariants, createProductVariant, updateProductVariant, deleteProductVariant, ProductVariant } from "@/lib/api";
import { getLotByProduct, getAuctionByProduct, saveLotPricing, RcgTier } from "@/lib/api";
import { toast } from "sonner";
import { PerfilSidebar } from "@/components/layout/perfil-sidebar";

function toDatetimeLocal(value: any): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function VariantManager({ productId }: { productId: string }) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [editing, setEditing] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getProductVariants(productId);
      setVariants(data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [productId]);

  async function save() {
    if (!name.trim()) { toast.error("Ingresa el nombre de la variante (ej. Talla M - Azul)"); return; }
    try {
      if (editing) {
        await updateProductVariant(editing.id, {
          name: name.trim(),
          price: price !== "" ? Number(price) : undefined,
          stock: stock !== "" ? Number(stock) : undefined,
        });
        toast.success("Variante actualizada");
      } else {
        await createProductVariant(productId, {
          name: name.trim(),
          price: price !== "" ? Number(price) : undefined,
          stock: stock !== "" ? Number(stock) : 0,
        });
        toast.success("Variante creada");
      }
      setName(""); setPrice(""); setStock(""); setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Error al guardar variante");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar esta variante?")) return;
    try {
      await deleteProductVariant(id);
      toast.success("Variante eliminada");
      load();
    } catch { toast.error("Error al eliminar variante"); }
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <h3 className="text-lg font-bold text-slate-800 mb-1">Variantes</h3>
      <p className="text-xs text-slate-400 mb-4">Agrega variantes (talla, color, etc.) con stock y precio independientes.</p>

      {loading ? (
        <p className="text-sm text-slate-400 py-2">Cargando...</p>
      ) : variants.length > 0 ? (
        <div className="space-y-2 mb-4">
          {variants.map(v => (
            <div key={v.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">{v.name}</p>
                <p className="text-xs text-slate-400">
                  {v.price != null ? `S/ ${Number(v.price).toFixed(2)} · ` : ""}
                  {Number(v.stock)} disponibles
                </p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => { setEditing(v); setName(v.name); setPrice(v.price != null ? String(v.price) : ""); setStock(String(v.stock)); }}
                  className="px-2 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-50 rounded transition-colors">Editar</button>
                <button type="button" onClick={() => remove(v.id)}
                  className="px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded transition-colors">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 mb-4">Sin variantes. Este producto se vende como una sola unidad.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_100px_auto] gap-2 items-end">
        <div>
          <label className="form-label">Nombre (ej. Talla M - Azul)</label>
          <input value={name} onChange={e => setName(e.target.value)} className="form-input-custom w-full" placeholder="Talla M - Azul" />
        </div>
        <div>
          <label className="form-label">Precio (S/)</label>
          <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="form-input-custom w-full" placeholder="0.00" />
        </div>
        <div>
          <label className="form-label">Stock</label>
          <input type="number" min="0" step="1" value={stock} onChange={e => setStock(e.target.value)} className="form-input-custom w-full" placeholder="0" />
        </div>
        <button type="button" onClick={save}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold px-4 py-3 rounded-xl shadow-md hover:opacity-90 transition-opacity">
          {editing ? "Actualizar" : "Agregar"}
        </button>
      </div>
    </div>
  );
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
    estado: "nuevo",
    ubicacion: "",
    divisible: true,
    tipo_subasta: "inglesa",
    canal: "subasta",
    precio_objetivo: "",
    metraje: "",
    habitaciones: "",
    banos: "",
    distrito: "",
    duracion_contrato: "",
    garantia_meses: "",
    mantenimiento_incluido: false,
    separo_monto: "",
  });
  const [tiers, setTiers] = useState<RcgTier[]>([]);
  const [metaVenta, setMetaVenta] = useState("");
  const [nivelCoincidencia, setNivelCoincidencia] = useState("estricta");
  const [esServicio, setEsServicio] = useState(false);
  const [tipoInmobiliario, setTipoInmobiliario] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [imagesUploading, setImagesUploading] = useState(false);
  const esInmobiliario = /inmob/i.test(categoryName || "");

  // III.4 Verificación de stock y ficha técnica
  const [categoryRequires, setCategoryRequires] = useState(false);
  const [verificationEnabled, setVerificationEnabled] = useState(false);
  const [verifChanged, setVerifChanged] = useState(true);
  const [verifStatus, setVerifStatus] = useState("none");
  const [verifObservaciones, setVerifObservaciones] = useState("");
  const [verifFotos, setVerifFotos] = useState<string[]>([]);
  const [verifVideo, setVerifVideo] = useState("");
  const [verifNumeroSerie, setVerifNumeroSerie] = useState("");
  const [verifDocs, setVerifDocs] = useState<string[]>([]);
  const [verifCapUnidades, setVerifCapUnidades] = useState("");
  const [verifCapPlazo, setVerifCapPlazo] = useState("");
  const [verifDeclaracion, setVerifDeclaracion] = useState(false);
  // VI. Documentación legal inmobiliaria (PDF) y ubicación geográfica
  const [docPartida, setDocPartida] = useState("");
  const [docHRPU, setDocHRPU] = useState("");
  const [docArbitrios, setDocArbitrios] = useState("");
  const [docCargas, setDocCargas] = useState("");
  const [docPoderes, setDocPoderes] = useState("");
  const [docPermisos, setDocPermisos] = useState<string[]>([]);
  const [docContrato, setDocContrato] = useState<string[]>([]);
  const [verifTitular, setVerifTitular] = useState("");
  const [verifDeclaraCargas, setVerifDeclaraCargas] = useState(false);
  const [inmDireccion, setInmDireccion] = useState("");
  const [inmLatitud, setInmLatitud] = useState("");
  const [inmLongitud, setInmLongitud] = useState("");

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

    getCategories()
      .then((cats) => {
        const flat: any[] = [];
        const flatten = (items: any[]) => { for (const c of items) { flat.push(c); if (c.children?.length) flatten(c.children); } };
        flatten(cats);
        const cat = flat.find(c => c.id === categoryId);
        setCategoryRequires(!!cat?.require_verification);
        if (!!cat?.require_verification && !editingId) setVerificationEnabled(true);
      })
      .catch(() => {});

    if (editingId) {
      Promise.all([loadFields, getMyProduct(editingId), getVerification(editingId).catch(() => ({ verification: null }))])
        .then(([_, p, verRes]: any) => {
          const specForm: Record<string, string> = {};
          Object.entries(p.specifications || {}).forEach(([k, v]) => { specForm[k] = String(v ?? ""); });
          const specStock = specForm["Stock"] ?? specForm["stock"] ?? "";
          const stockVal = p.stock != null && String(p.stock) !== "" ? String(p.stock) : specStock;
          if (specStock !== "") {
            const stockKey = specForm["Stock"] !== undefined ? "Stock" : "stock";
            specForm[stockKey] = stockVal;
          }
          setForm(specForm);
          setNivelCoincidencia(p.nivel_coincidencia || "estricta");
          setEsServicio(!!p.es_servicio);
          setTipoInmobiliario(p.tipo_inmobiliario || "");
          setProductImages(Array.isArray(p.images) ? p.images : []);
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
            estado: p.estado || "nuevo",
            ubicacion: p.ubicacion || "",
            divisible: p.divisible ?? true,
            tipo_subasta: "inglesa",
            canal: p.canal || "subasta",
            precio_objetivo: p.precio_objetivo != null ? String(p.precio_objetivo) : "",
            metraje: p.metraje != null ? String(p.metraje) : "",
            habitaciones: p.habitaciones != null ? String(p.habitaciones) : "",
            banos: p.banos != null ? String(p.banos) : "",
            distrito: p.distrito || "",
            duracion_contrato: p.duracion_contrato || "",
            garantia_meses: p.garantia_meses != null ? String(p.garantia_meses) : "",
            mantenimiento_incluido: !!p.mantenimiento_incluido,
            separo_monto: p.separo_monto != null ? String(p.separo_monto) : "",
          });
          const ver = verRes?.verification;
          if (ver) {
            setVerifFotos(ver.payload?.fotografias || []);
            setVerifVideo(ver.payload?.video || "");
            setVerifNumeroSerie(ver.payload?.numero_serie || "");
            setVerifDocs(ver.payload?.documentos || []);
            const cap = ver.payload?.capacidad_produccion;
            if (cap) { setVerifCapUnidades(String(cap.unidades_mes ?? "")); setVerifCapPlazo(cap.plazo || ""); }
            setVerifDeclaracion(!!ver.payload?.declaracion_ficha);
            const inm = ver.payload?.inmobiliario;
            if (inm) {
              setDocPartida(inm.partida_registral || "");
              setDocHRPU(inm.hr_pu_doc || "");
              setDocArbitrios(inm.arbitrios_doc || "");
              setDocCargas(inm.cargas_gravamenes_doc || "");
              setDocPoderes(inm.poderes_doc || "");
              setDocPermisos(Array.isArray(inm.permisos_docs) ? inm.permisos_docs : []);
              setDocContrato(Array.isArray(inm.contrato_docs) ? inm.contrato_docs : []);
              setVerifTitular(inm.titular_anunciante || "");
              setVerifDeclaraCargas(inm.declaracion_cargas === true);
            }
            setVerifStatus(ver.estado || "none");
            setVerifObservaciones(ver.observaciones || "");
            setVerificationEnabled(true);
            setVerifChanged(false);
          }
          if (p.metodo_pago === "subasta") {
            getAuctionByProduct(editingId)
              .then(auction => {
                if (auction?.tipo_subasta) {
                  setConditions(prev => ({ ...prev, tipo_subasta: auction.tipo_subasta }));
                }
              })
              .catch(() => {});
          }
          if (p.metodo_pago === "venta_por_lote") {
            getLotByProduct(editingId)
              .then(lot => {
                if (lot) {
                  setTiers((lot.rcg_tiers || []).map(t => ({ ...t })));
                  if (lot.meta_venta != null) setMetaVenta(String(lot.meta_venta));
                  setConditions(prev => ({ ...prev, divisible: lot.divisible !== false }));
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

  function VideoUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const url = await uploadVideo(file);
        onChange(url);
      } catch { toast.error("Error al subir video"); }
      finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
    }

    return (
      <div>
        {value && (
          <div className="flex items-center gap-3 mb-2">
            <video src={getImageUrl(value)} className="w-40 h-28 object-cover rounded-lg border border-gray-200" controls />
            <button type="button" onClick={() => onChange("")} className="text-xs text-red-500 font-medium hover:text-red-700">Quitar</button>
          </div>
        )}
        {uploading ? (
          <div className="w-40 h-28 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : (
          <input ref={inputRef} type="file" accept="video/*" onChange={handleFile}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
        )}
      </div>
    );
  }

  function DocUpload({ urls, onChange }: { urls: string[]; onChange: (urls: string[]) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
        const newUrls: string[] = [];
        for (const f of Array.from(files)) newUrls.push(await uploadFile(f));
        onChange([...urls, ...newUrls]);
      } catch { toast.error("Error al subir documentos"); }
      finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
    }

    return (
      <div>
        {urls.length > 0 && (
          <ul className="mb-2 space-y-1">
            {urls.map((url, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-purple-700">
                <a href={getImageUrl(url)} target="_blank" rel="noreferrer" className="underline truncate max-w-[200px]">Documento {i + 1}</a>
                <button type="button" onClick={() => onChange(urls.filter((_, j) => j !== i))} className="text-xs text-red-500 font-medium">Quitar</button>
              </li>
            ))}
          </ul>
        )}
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" multiple onChange={handleFiles}
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
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
      // Inmobiliario: campos obligatorios
      if (esInmobiliario) {
        if (!tipoInmobiliario) { toast.error("Selecciona el tipo de operación inmobiliaria (alquiler o venta)"); return; }
        if (!conditions.metraje || Number(conditions.metraje) <= 0) { toast.error("Ingresa el metraje del inmueble"); return; }
        if (conditions.habitaciones === "" || Number(conditions.habitaciones) < 0) { toast.error("Ingresa el número de habitaciones"); return; }
        if (conditions.banos === "" || Number(conditions.banos) < 0) { toast.error("Ingresa el número de baños"); return; }
        if (!inmDireccion.trim()) { toast.error("Ingresa la dirección del inmueble"); return; }
        if (!conditions.distrito.trim()) { toast.error("Ingresa el distrito del inmueble"); return; }
        if (!conditions.estado || !String(conditions.estado).trim()) { toast.error("Selecciona el estado del inmueble"); return; }
        if (tipoInmobiliario === "alquiler") {
          if (!conditions.duracion_contrato.trim()) { toast.error("Alquiler: indica la duración del contrato (ej. 12 meses)"); return; }
          if (conditions.garantia_meses === "" || Number(conditions.garantia_meses) < 0) { toast.error("Alquiler: indica los meses de garantía/depósito"); return; }
        }
        if (conditions.separo_monto !== "" && Number(conditions.separo_monto) <= 0) { toast.error("El monto de separo/garantía debe ser mayor a cero"); return; }
      }
      // Inmobiliario: mínimo 5 fotos
      if (esInmobiliario && productImages.length < 5) {
        toast.error("Inmobiliario: adjunta al menos 5 fotografías del inmueble");
        return;
      }
      // Validación de precio: no puede ser cero ni negativo
      if (conditions.metodo_pago === "subasta") {
        const inicial = Number(conditions.precio_base);
        if (!Number.isFinite(inicial) || inicial <= 0) { toast.error("El precio inicial de la subasta debe ser mayor a cero"); return; }
      } else if (conditions.metodo_pago === "venta_por_lote") {
        const lot = isLot && lotTotal > 0 ? lotTotal : Number(conditions.precio_lote);
        if (!Number.isFinite(lot) || lot <= 0) { toast.error("El precio del lote debe ser mayor a cero"); return; }
      } else {
        const base = Number(conditions.precio_base);
        if (!Number.isFinite(base) || base <= 0) { toast.error("El precio del producto debe ser mayor a cero"); return; }
      }
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
        tipo_subasta: conditions.metodo_pago === "subasta" ? conditions.tipo_subasta : undefined,
        modalidad: conditions.metodo_pago === "subasta" ? conditions.tipo_subasta : undefined,
        canal: conditions.canal || (conditions.metodo_pago === "subasta" ? "subasta" : conditions.metodo_pago === "venta_por_lote" ? "demanda_agregada" : "oferta"),
        precio_objetivo: conditions.precio_objetivo ? parseFloat(conditions.precio_objetivo) : undefined,
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
        divisible: (isLot || conditions.metodo_pago === "subasta") ? conditions.divisible : undefined,
        nivel_coincidencia: nivelCoincidencia,
        estado: conditions.estado || "nuevo",
        ubicacion: conditions.ubicacion || undefined,
        es_servicio: !!esServicio,
        tipo_inmobiliario: esInmobiliario && tipoInmobiliario ? tipoInmobiliario : null,
        metraje: esInmobiliario && conditions.metraje !== "" ? Number(conditions.metraje) : undefined,
        habitaciones: esInmobiliario && conditions.habitaciones !== "" ? Number(conditions.habitaciones) : undefined,
        banos: esInmobiliario && conditions.banos !== "" ? Number(conditions.banos) : undefined,
        distrito: esInmobiliario && conditions.distrito ? conditions.distrito : undefined,
        direccion: esInmobiliario && inmDireccion.trim() ? inmDireccion.trim() : undefined,
        duracion_contrato: esInmobiliario && tipoInmobiliario === "alquiler" && conditions.duracion_contrato ? conditions.duracion_contrato : undefined,
        garantia_meses: esInmobiliario && tipoInmobiliario === "alquiler" && conditions.garantia_meses !== "" ? Number(conditions.garantia_meses) : undefined,
        mantenimiento_incluido: esInmobiliario && tipoInmobiliario === "alquiler" ? !!conditions.mantenimiento_incluido : undefined,
        separo_monto: esInmobiliario && conditions.separo_monto !== "" ? Number(conditions.separo_monto) : undefined,
        images: productImages,
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
      if (savedId && (conditions.metodo_pago === "subasta" || conditions.metodo_pago === "venta_por_lote" || esInmobiliario)
          && verificationEnabled && verifChanged) {
        try {
          const v = await submitVerification(savedId, {
            fotografias: verifFotos,
            video: verifVideo || undefined,
            numero_serie: verifNumeroSerie || undefined,
            documentos: verifDocs,
            capacidad_produccion: isLot && verifCapUnidades
              ? { unidades_mes: Number(verifCapUnidades) || 0, plazo: verifCapPlazo || undefined }
              : undefined,
            declaracion_ficha: verifDeclaracion,
            // VI. Inmobiliario: expediente legal completo + ubicación geográfica
            partida_registral_doc: docPartida || undefined,
            hr_pu_doc: docHRPU || undefined,
            arbitrios_doc: docArbitrios || undefined,
            cargas_gravamenes_doc: docCargas || undefined,
            poderes_doc: docPoderes || undefined,
            permisos_docs: docPermisos.length > 0 ? docPermisos : undefined,
            contrato_docs: docContrato.length > 0 ? docContrato : undefined,
            titular_anunciante: verifTitular.trim() || undefined,
            declaracion_cargas: verifDeclaraCargas === true,
            latitud: inmLatitud !== "" ? Number(inmLatitud) : undefined,
            longitud: inmLongitud !== "" ? Number(inmLongitud) : undefined,
            direccion: inmDireccion || undefined,
          });
          setVerifStatus(v.estado);
          setVerifObservaciones(v.observaciones || "");
          setVerifChanged(false);
          toast.success("Evidencia enviada para verificación");
        } catch (e: any) {
          toast.error(e.message || "Error al enviar la verificación");
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

                  {/* Nivel de coincidencia permitido (III.3) */}
                  <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                    <label className="form-label pt-2">Coincidencia de producto</label>
                    <div className="space-y-2">
                      {[
                        { value: "estricta", title: "Estricta", desc: "100%: todas las especificaciones iguales" },
                        { value: "flexible", title: "Flexible", desc: "Coinciden los atributos principales; se permite variar 1 atributo secundario" },
                        { value: "amplia", title: "Amplia", desc: "Coincidencia esencial por modelo o categoría; variantes libres" },
                      ].map(opt => (
                        <label key={opt.value} className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition-colors ${nivelCoincidencia === opt.value ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                          <input type="radio" name="nivel_coincidencia" value={opt.value} checked={nivelCoincidencia === opt.value}
                            onChange={() => setNivelCoincidencia(opt.value)} className="mt-1 accent-purple-600" />
                          <span>
                            <span className="block text-sm font-bold text-slate-800">{opt.title}</span>
                            <span className="block text-xs text-slate-500">{opt.desc}</span>
                          </span>
                        </label>
                      ))}
                    </div>
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
                        <label className="form-label pt-2">Tipo de subasta</label>
                        <div>
                          <select value={conditions.tipo_subasta} onChange={e => setConditions({ ...conditions, tipo_subasta: e.target.value })}
                            className="w-full form-input-custom focus:ring-purple-500 max-w-xs">
                            <option value="inglesa">Subasta inglesa (pujas visibles)</option>
                            <option value="sobre_cerrado">Oferta privada en sobre cerrado</option>
                          </select>
                          <p className="text-xs text-gray-400 mt-1">En sobre cerrado las ofertas permanecen ocultas hasta el cierre.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                        <label className="form-label pt-2">Canal</label>
                        <div>
                          <select value={conditions.canal} onChange={e => setConditions({ ...conditions, canal: e.target.value })}
                            className="w-full form-input-custom focus:ring-purple-500 max-w-xs">
                            <option value="subasta">Subasta</option>
                            <option value="demanda_agregada">Demanda agregada (lote)</option>
                            <option value="subasta_inversa">Subasta inversa (RFQ)</option>
                            <option value="oferta">Oferta directa</option>
                          </select>
                          <p className="text-xs text-gray-400 mt-1">Define el canal de la oportunidad transaccional (afecta la regla de garantía aplicable).</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                        <label className="form-label pt-2">Precio objetivo</label>
                        <input type="number" step="0.01" value={conditions.precio_objetivo} onChange={e => setConditions({ ...conditions, precio_objetivo: e.target.value })}
                          className="w-full form-input-custom focus:ring-purple-500 max-w-xs" placeholder="0.00" />
                      </div>
                      <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                        <label className="form-label pt-2">Incremento mínimo</label>
                        <input type="number" step="0.01" value={conditions.incremento_minimo} onChange={e => setConditions({ ...conditions, incremento_minimo: e.target.value })}
                          className="w-full form-input-custom focus:ring-purple-500 max-w-xs" placeholder="1.00" />
                        <p className="text-xs text-gray-400 mt-1 col-start-2">Solo aplica a subasta inglesa; en sobre cerrado no se usa.</p>
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
                        <label className="form-label pt-2">Divisibilidad del lote</label>
                        <div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setConditions({ ...conditions, divisible: true })}
                              className={`flex-1 max-w-[180px] rounded-xl border px-3 py-2 text-left transition-colors ${conditions.divisible ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-400"}`}>
                              <span className="block text-sm font-semibold text-gray-800">Divisible</span>
                              <span className="block text-[11px] text-gray-500">Cada participante puede tomar varias unidades</span>
                            </button>
                            <button type="button" onClick={() => setConditions({ ...conditions, divisible: false })}
                              className={`flex-1 max-w-[180px] rounded-xl border px-3 py-2 text-left transition-colors ${!conditions.divisible ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-400"}`}>
                              <span className="block text-sm font-semibold text-gray-800">Indivisible</span>
                              <span className="block text-[11px] text-gray-500">Cada participante compromete 1 unidad</span>
                            </button>
                          </div>
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

                  {(conditions.metodo_pago === "subasta" || conditions.metodo_pago === "venta_por_lote") && (
                    <div className="border-t border-gray-100 pt-5 mt-2">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <label className="text-sm font-bold text-gray-800 block mb-1">Verificación de stock y ficha técnica</label>
                          <p className="text-xs text-gray-400">
                            {categoryRequires
                              ? "Esta categoría requiere que LOTIFYX verifique la evidencia de posesión o capacidad de suministro antes de activar la subasta o compra grupal."
                              : "Opcional: envía evidencia (fotos, video, documentos, número de serie, ubicación) para que LOTIFYX la verifique."}
                          </p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                          <input type="checkbox" checked={verificationEnabled} disabled={categoryRequires}
                            onChange={e => { setVerificationEnabled(e.target.checked); setVerifChanged(true); }}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                          <span className="text-sm text-gray-700">Enviar verificación</span>
                        </label>
                      </div>

                      {verifStatus !== "none" && (
                        <div className="mb-4 flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            verifStatus === "approved" ? "bg-green-100 text-green-700" :
                            verifStatus === "rechazada" ? "bg-red-100 text-red-700" :
                            verifStatus === "pendiente" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {verifStatus === "approved" ? "Verificación aprobada por LOTIFYX" :
                             verifStatus === "rechazada" ? "Verificación rechazada" :
                             verifStatus === "pendiente" ? "Verificación en revisión" : "Sin verificación"}
                          </span>
                          {verifObservaciones && <span className="text-xs text-gray-500">Observación: {verifObservaciones}</span>}
                        </div>
                      )}

                      {verificationEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div className="md:col-span-2">
                            <label className="form-label">Fotografías de la evidencia del stock o del bien</label>
                            <GalleryUpload urls={verifFotos} onChange={(u) => { setVerifFotos(u); setVerifChanged(true); }} />
                          </div>
                          <div>
                            <label className="form-label">Video de evidencia</label>
                            <VideoUpload value={verifVideo} onChange={(v) => { setVerifVideo(v); setVerifChanged(true); }} />
                          </div>
                          <div>
                            <label className="form-label">Número de serie</label>
                            <input type="text" value={verifNumeroSerie} onChange={e => { setVerifNumeroSerie(e.target.value); setVerifChanged(true); }}
                              className="w-full form-input-custom focus:ring-purple-500" placeholder="Opcional" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="form-label">Documentos (factura, guía, certificado de origen)</label>
                            <DocUpload urls={verifDocs} onChange={(u) => { setVerifDocs(u); setVerifChanged(true); }} />
                          </div>
                          {esInmobiliario && (
                            <>
                              <div className="md:col-span-2">
                                <label className="form-label">Checklist del expediente legal del inmueble</label>
                                <p className="text-xs text-gray-400 mb-3">Adjunta los documentos en PDF. LOTIFYX revisará el expediente completo antes de aprobar la publicación.</p>
                                <div className="space-y-3">
                                  <div className="border rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <p className="text-xs font-bold text-gray-700">1. Titularidad</p>
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${verifTitular.trim() ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{verifTitular.trim() ? "✓ Completo" : "Pendiente"}</span>
                                    </div>
                                    <input type="text" value={verifTitular} onChange={e => { setVerifTitular(e.target.value); setVerifChanged(true); }}
                                      className="w-full form-input-custom focus:ring-purple-500" placeholder="Propietario único, copropietario o mandato/apoderado" />
                                  </div>
                                  <div className="border rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <p className="text-xs font-bold text-gray-700">2. Partida registral</p>
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${docPartida ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>{docPartida ? "✓ Recibido" : "Obligatorio"}</span>
                                    </div>
                                    <DocUpload urls={docPartida ? [docPartida] : []} onChange={(u) => { setDocPartida(u[0] || ""); setVerifChanged(true); }} />
                                  </div>
                                  <div className="border rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <p className="text-xs font-bold text-gray-700">3. HR/PU (Hoja Registral / Partida Única)</p>
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${docHRPU ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>{docHRPU ? "✓ Recibido" : "Obligatorio"}</span>
                                    </div>
                                    <DocUpload urls={docHRPU ? [docHRPU] : []} onChange={(u) => { setDocHRPU(u[0] || ""); setVerifChanged(true); }} />
                                  </div>
                                  <div className="border rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <p className="text-xs font-bold text-gray-700">4. Certificado de cargas y gravámenes</p>
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${docCargas ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>{docCargas ? "✓ Recibido" : "Obligatorio"}</span>
                                    </div>
                                    <DocUpload urls={docCargas ? [docCargas] : []} onChange={(u) => { setDocCargas(u[0] || ""); setVerifChanged(true); }} />
                                    <label className="flex items-center gap-2 text-xs text-gray-600 mt-2 cursor-pointer">
                                      <input type="checkbox" checked={verifDeclaraCargas} onChange={e => { setVerifDeclaraCargas(e.target.checked); setVerifChanged(true); }} className="accent-purple-600 w-3.5 h-3.5" />
                                      Declaro que no existen cargas o gravámenes ocultos sobre el inmueble
                                    </label>
                                  </div>
                                  <div className="border rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <p className="text-xs font-bold text-gray-700">5. No adeudo de arbitrios</p>
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${docArbitrios ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>{docArbitrios ? "✓ Recibido" : "Obligatorio"}</span>
                                    </div>
                                    <DocUpload urls={docArbitrios ? [docArbitrios] : []} onChange={(u) => { setDocArbitrios(u[0] || ""); setVerifChanged(true); }} />
                                  </div>
                                  <div className="border rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <p className="text-xs font-bold text-gray-700">6. Poderes (solo si actúas por mandato)</p>
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${docPoderes ? "bg-green-100 text-green-700" : /mandat|apoder|represent/i.test(verifTitular) && !/propietari/i.test(verifTitular) ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                                        {docPoderes ? "✓ Recibido" : /mandat|apoder|represent/i.test(verifTitular) && !/propietari/i.test(verifTitular) ? "Obligatorio" : "No aplica"}
                                      </span>
                                    </div>
                                    <DocUpload urls={docPoderes ? [docPoderes] : []} onChange={(u) => { setDocPoderes(u[0] || ""); setVerifChanged(true); }} />
                                  </div>
                                  <div className="border rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <p className="text-xs font-bold text-gray-700">7. Permisos y licencias</p>
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${docPermisos.length > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{docPermisos.length > 0 ? `✓ ${docPermisos.length} archivo(s)` : "Opcional"}</span>
                                    </div>
                                    <DocUpload urls={docPermisos} onChange={(u) => { setDocPermisos(u); setVerifChanged(true); }} />
                                  </div>
                                  <div className="border rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <p className="text-xs font-bold text-gray-700">8. Documentación contractual (minuta/contrato)</p>
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${docContrato.length > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{docContrato.length > 0 ? `✓ ${docContrato.length} archivo(s)` : "Opcional"}</span>
                                    </div>
                                    <DocUpload urls={docContrato} onChange={(u) => { setDocContrato(u); setVerifChanged(true); }} />
                                  </div>
                                </div>
                              </div>
                              <div className="md:col-span-2">
                                <label className="form-label">Ubicación geográfica del inmueble</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="md:col-span-3">
                                    <input type="text" value={inmDireccion} onChange={e => setInmDireccion(e.target.value)}
                                      className="w-full form-input-custom focus:ring-purple-500" placeholder="Dirección exacta (ej. Av. Los Sauces 123, Lima)" />
                                  </div>
                                  <div>
                                    <input type="number" step="any" value={inmLatitud} onChange={e => setInmLatitud(e.target.value)}
                                      className="w-full form-input-custom focus:ring-purple-500" placeholder="Latitud" />
                                  </div>
                                  <div>
                                    <input type="number" step="any" value={inmLongitud} onChange={e => setInmLongitud(e.target.value)}
                                      className="w-full form-input-custom focus:ring-purple-500" placeholder="Longitud" />
                                  </div>
                                  <p className="text-xs text-gray-400">Dirección exacta o coordenadas (latitud / longitud)</p>
                                </div>
                              </div>
                            </>
                          )}
                          {isLot && (
                            <>
                              <div>
                                <label className="form-label">Capacidad de producción (unidades/mes)</label>
                                <input type="number" min="0" value={verifCapUnidades}
                                  onChange={e => { setVerifCapUnidades(e.target.value); setVerifChanged(true); }}
                                  className="w-full form-input-custom focus:ring-purple-500" placeholder="0" />
                              </div>
                              <div>
                                <label className="form-label">Plazo de suministro</label>
                                <input type="text" value={verifCapPlazo}
                                  onChange={e => { setVerifCapPlazo(e.target.value); setVerifChanged(true); }}
                                  className="w-full form-input-custom focus:ring-purple-500" placeholder="Ej: 15 días" />
                              </div>
                            </>
                          )}
                          <div className="md:col-span-2">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input type="checkbox" checked={verifDeclaracion}
                                onChange={e => { setVerifDeclaracion(e.target.checked); setVerifChanged(true); }}
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                              <span className="text-sm text-gray-600">
                                Declaro que la <strong>ficha técnica</strong> (especificaciones declaradas) es correcta y corresponde con la evidencia aportada.
                              </span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Tipo de publicación */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="md:col-span-2">
                          <label className="form-label pt-0">Tipo de publicación</label>
                          <div className="flex gap-3">
                            <button type="button" onClick={() => setEsServicio(false)}
                              className={`flex-1 rounded-xl border px-4 py-3 text-left transition-colors ${!esServicio ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-400"}`}>
                              <span className="block text-sm font-semibold text-gray-800">Producto físico</span>
                              <span className="block text-xs text-gray-500">Con stock y envío</span>
                            </button>
                            <button type="button" onClick={() => setEsServicio(true)}
                              className={`flex-1 rounded-xl border px-4 py-3 text-left transition-colors ${esServicio ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-400"}`}>
                              <span className="block text-sm font-semibold text-gray-800">Servicio</span>
                              <span className="block text-xs text-gray-500">Sin stock físico ni envío</span>
                            </button>
                          </div>
                          {esInmobiliario && (
                            <div className="mt-3">
                              <label className="form-label">Tipo de operación inmobiliaria *</label>
                              <select value={tipoInmobiliario} onChange={e => setTipoInmobiliario(e.target.value)}
                                className="w-full form-input-custom focus:ring-purple-500">
                                <option value="">Selecciona el tipo</option>
                                <option value="alquiler">Alquiler</option>
                                <option value="venta">Venta</option>
                              </select>
                              <p className="text-xs text-gray-400 mt-1">La venta inmobiliaria requiere aprobación y verificación reforzada por LOTIFYX.</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                <div>
                                  <label className="form-label">Metraje (m²) *</label>
                                  <input type="number" min="1" step="0.1" value={conditions.metraje}
                                    onChange={e => setConditions({ ...conditions, metraje: e.target.value })}
                                    className="w-full form-input-custom focus:ring-purple-500" placeholder="90" />
                                </div>
                                <div>
                                  <label className="form-label">Habitaciones *</label>
                                  <input type="number" min="0" step="1" value={conditions.habitaciones}
                                    onChange={e => setConditions({ ...conditions, habitaciones: e.target.value })}
                                    className="w-full form-input-custom focus:ring-purple-500" placeholder="3" />
                                </div>
                                <div>
                                  <label className="form-label">Baños *</label>
                                  <input type="number" min="0" step="1" value={conditions.banos}
                                    onChange={e => setConditions({ ...conditions, banos: e.target.value })}
                                    className="w-full form-input-custom focus:ring-purple-500" placeholder="2" />
                                </div>
                                <div>
                                  <label className="form-label">Distrito *</label>
                                  <input type="text" value={conditions.distrito}
                                    onChange={e => setConditions({ ...conditions, distrito: e.target.value })}
                                    className="w-full form-input-custom focus:ring-purple-500" placeholder="Miraflores" />
                                </div>
                                <div className="col-span-2 md:col-span-4">
                                  <label className="form-label">Dirección *</label>
                                  <input type="text" value={inmDireccion} onChange={e => setInmDireccion(e.target.value)}
                                    className="w-full form-input-custom focus:ring-purple-500" placeholder="Av. Los Sauces 123, Lima" />
                                </div>
                              </div>
                              {/* Separo / garantía requerida */}
                              <div className="mt-3">
                                <label className="form-label">Separo o garantía requerida (opcional)</label>
                                <input type="number" min="0" step="0.01" value={conditions.separo_monto}
                                  onChange={e => setConditions({ ...conditions, separo_monto: e.target.value })}
                                  className="w-full form-input-custom focus:ring-purple-500 max-w-xs" placeholder="Ej. 5000" />
                                <p className="text-xs text-gray-400 mt-1">Monto que el interesado debe depositar para separar el inmueble. No equivale a transferencia de propiedad ni sustituye actos notariales o registrales.</p>
                              </div>
                              {/* Parámetros propios según mecanismo elegido */}
                              {tipoInmobiliario === "alquiler" && (
                                <div className="mt-3 border border-blue-100 bg-blue-50/50 rounded-xl p-3">
                                  <p className="text-xs font-bold text-blue-800 mb-2">Parámetros de alquiler</p>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                      <label className="form-label">Duración del contrato *</label>
                                      <input type="text" value={conditions.duracion_contrato}
                                        onChange={e => setConditions({ ...conditions, duracion_contrato: e.target.value })}
                                        className="w-full form-input-custom focus:ring-purple-500" placeholder="Ej. 12 meses" />
                                    </div>
                                    <div>
                                      <label className="form-label">Garantía (meses) *</label>
                                      <input type="number" min="0" step="1" value={conditions.garantia_meses}
                                        onChange={e => setConditions({ ...conditions, garantia_meses: e.target.value })}
                                        className="w-full form-input-custom focus:ring-purple-500" placeholder="1" />
                                    </div>
                                    <div className="flex items-end pb-1">
                                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked={!!conditions.mantenimiento_incluido}
                                          onChange={e => setConditions({ ...conditions, mantenimiento_incluido: e.target.checked })}
                                          className="accent-purple-600 w-4 h-4" />
                                        Mantenimiento incluido
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {tipoInmobiliario === "venta" && (
                                <div className="mt-3 border border-emerald-100 bg-emerald-50/60 rounded-xl p-3">
                                  <p className="text-xs font-semibold text-emerald-800">Venta directa sujeta a aprobación</p>
                                  <p className="text-xs text-gray-600 mt-0.5">LOTIFYX revisará el expediente legal del inmueble. La publicación solo se activa cuando la verificación sea aprobada.</p>
                                </div>
                              )}
                              {conditions.metodo_pago === "subasta" && (
                                <div className="mt-3 border border-purple-100 bg-purple-50/60 rounded-xl p-3">
                                  <p className="text-xs font-semibold text-purple-800">Mecanismo anónimo / subasta</p>
                                  <p className="text-xs text-gray-600 mt-0.5">Con subasta inglesa los postores compiten con pujas visibles; con sobre cerrado las ofertas permanecen ocultas (mecanismo anónimo). Requiere precio inicial, incremento mínimo y cierre estimado.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Galería de imágenes */}
                      <div className="mt-4">
                        <label className="form-label pt-0">Galería de imágenes</label>
                        <p className="text-xs text-gray-400 mb-2">Sube varias imágenes de tu producto o servicio.</p>
                        <div className="flex flex-wrap gap-2">
                          {productImages.map((url, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                              <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => setProductImages(productImages.filter((_, j) => j !== i))}
                                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]">X</button>
                            </div>
                          ))}
                          <button type="button" onClick={async () => {
                            const input = document.createElement("input");
                            input.type = "file"; input.accept = "image/*"; input.multiple = true;
                            input.onchange = async (e: any) => {
                              const files = e.target.files;
                              if (!files?.length) return;
                              setImagesUploading(true);
                              try {
                                for (const f of files) {
                                  const url = await uploadImage(f);
                                  setProductImages(prev => [...prev, url]);
                                }
                              } catch { toast.error("Error al subir imagen"); }
                              finally { setImagesUploading(false); }
                            };
                            input.click();
                          }}
                            className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-3xl text-gray-300 hover:border-purple-400 hover:text-purple-400 transition-colors">
                            {imagesUploading ? <span className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /> : "+"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {!esServicio && (
                          <div>
                            <label className="form-label pt-0">Condición del producto</label>
                            <select value={conditions.estado} onChange={e => setConditions({ ...conditions, estado: e.target.value })}
                              className="w-full form-input-custom focus:ring-purple-500">
                              <option value="nuevo">Nuevo</option>
                              <option value="usado">Usado</option>
                              <option value="reacondicionado">Reacondicionado</option>
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="form-label pt-0">Ubicación del bien</label>
                          <input type="text" value={conditions.ubicacion} onChange={e => setConditions({ ...conditions, ubicacion: e.target.value })}
                            className="w-full form-input-custom focus:ring-purple-500" placeholder="Ciudad, país" />
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-400 mt-3">
                        La verificación de LOTIFYX no sustituye la obligación del vendedor de entregar el bien ofrecido ni implica garantía absoluta de LOTIFYX.
                      </p>
                    </div>
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

              {/* Variantes (solo edición) */}
              {isEditing && <VariantManager productId={editingId} />}

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

