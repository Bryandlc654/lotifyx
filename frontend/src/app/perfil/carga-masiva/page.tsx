"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { bulkUploadProducts, getBulkTemplateUrl, getProfile, isAuthenticated, removeTokens } from "@/lib/api";
import { ChevronRight, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, MessageCircle, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function CargaMasivaPage() {
  const [userRole, setUserRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then((data) => {
        const u = data.user as any;
        setUserRole(u.role?.name || "");
      })
      .catch(() => { removeTokens(); router.push("/"); });
  }, [router]);

  async function handleUpload() {
    if (!file) { toast.error("Selecciona un archivo Excel"); return; }
    setUploading(true);
    setResult(null);
    try {
      const res = await bulkUploadProducts(file);
      setResult(res);
      setFile(null);
      toast.success(`${res.created} productos creados`);
    } catch (err: any) {
      toast.error(err.message || "Error al subir archivo");
    } finally {
      setUploading(false);
    }
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
            <button onClick={() => router.push("/perfil/mensajes")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mensajes
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
            <button onClick={() => router.push("/perfil/mis-fondos")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Fondos
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/carga-masiva")}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 border-l-2 border-slate-700 -ml-px">
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
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Ofrecer
            </button>
          )}
        </nav>

        <div className="max-w-4xl w-full">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">Inicio</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <button onClick={() => router.push("/perfil")} className="text-gray-400 hover:text-gray-600">Perfil</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-[#8234FE] font-semibold">Carga Masiva</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Carga Masiva de Productos</h1>
            <p className="text-gray-500 text-sm mt-1">Sube tus productos en lote desde un archivo Excel</p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Step 1: Download template */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">1</div>
                <h2 className="text-lg font-bold text-gray-800">Descarga la plantilla</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Descarga el archivo Excel de ejemplo, complétalo con tus productos y súbelo.
              </p>
              <a href={getBulkTemplateUrl()} target="_blank"
                className="flex items-center justify-center gap-2 w-full bg-purple-50 text-purple-700 font-semibold py-3 rounded-xl hover:bg-purple-100 transition-colors">
                <Download className="h-4 w-4" />
                Descargar plantilla Excel
              </a>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                <p className="font-semibold text-gray-600 mb-1">Columnas de la plantilla:</p>
                <ul className="space-y-0.5">
                  <li><strong>Título*</strong> — Nombre del producto (obligatorio)</li>
                  <li><strong>Categoría*</strong> — Nombre exacto de la categoría (obligatorio)</li>
                  <li><strong>Precio</strong> — Precio unitario</li>
                  <li><strong>Marca</strong> — Marca del producto</li>
                  <li><strong>Modelo</strong> — Modelo o referencia</li>
                  <li><strong>Stock</strong> — Cantidad disponible</li>
                  <li><strong>Descripción</strong> — Descripción general</li>
                  <li><strong>Condición</strong> — Nuevo, Usado, etc.</li>
                </ul>
              </div>
            </div>

            {/* Step 2: Upload */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">2</div>
                <h2 className="text-lg font-bold text-gray-800">Sube tu archivo</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Selecciona el archivo Excel con tus productos y súbelo.
              </p>

              {!file ? (
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50 cursor-pointer hover:border-purple-300 transition-colors">
                  <FileSpreadsheet className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Arrastra tu archivo Excel o{" "}
                    <span className="text-purple-600 font-medium underline">haz clic para buscar</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2">.xlsx, .xls — Máx 5 MB</p>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }} />
                </div>
              ) : (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-purple-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-purple-800 truncate">{file.name}</p>
                    <p className="text-xs text-purple-500">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="p-1 rounded-full hover:bg-purple-200 text-purple-500">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              )}

              <button onClick={handleUpload} disabled={!file || uploading}
                className="w-full mt-4 text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
                <Upload className="h-4 w-4 inline mr-2" />
                {uploading ? "Subiendo..." : "Subir productos"}
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Resultado de la carga</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{result.created}</p>
                  <p className="text-xs text-green-600">Creados</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-700">{result.errors}</p>
                  <p className="text-xs text-red-600">Errores</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <FileSpreadsheet className="h-6 w-6 text-gray-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-700">{result.total}</p>
                  <p className="text-xs text-gray-600">Total filas</p>
                </div>
              </div>

              {result.products.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Productos creados:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {result.products.map((p: any) => (
                      <div key={p.id} className="text-xs text-gray-600 bg-green-50 rounded-lg px-3 py-1.5">
                        {p.title || p.id}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errorDetails?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Errores detectados:
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {result.errorDetails.map((e: any, i: number) => (
                      <div key={i} className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5">
                        Fila {e.row}: {e.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

