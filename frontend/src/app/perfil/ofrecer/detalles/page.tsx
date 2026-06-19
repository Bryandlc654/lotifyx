"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getCategoryFields, getProfile, isAuthenticated, removeTokens, CategoryField } from "@/lib/api";
import { toast } from "sonner";

function DetallesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoria") || "";
  const categoryName = searchParams.get("nombre") || "";

  const [userRole, setUserRole] = useState("");
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({});

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

    getCategoryFields(categoryId)
      .then((catFields) => {
        setFields(catFields);
        const initial: Record<string, string> = {};
        catFields.forEach(f => { initial[f.name] = ""; });
        setForm(initial);
      })
      .catch(() => toast.error("Error al cargar campos"))
      .finally(() => setLoading(false));
  }, [categoryId, router]);

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
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/ofrecer")}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 border-l-2 border-slate-700 -ml-px">
              Ofrecer
            </button>
          )}
        </nav>
        <div className="max-w-4xl w-full">
          {/* Step indicator */}
          <nav className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm">1</span>
                <span className="font-semibold text-slate-900">Categoría</span>
              </div>
              <div className="h-[2px] w-16 md:w-24 bg-purple-500 mx-4"></div>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm">2</span>
                <span className="font-semibold text-purple-600">Detalles</span>
              </div>
              <div className="h-[2px] w-16 md:w-24 bg-slate-200 mx-4"></div>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 font-bold text-sm border border-slate-200">3</span>
                <span className="font-medium text-slate-400">Condiciones</span>
              </div>
            </div>
          </nav>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <nav className="flex border-b border-gray-100 px-6 pt-4">
              <button aria-current="page" className="px-4 py-2 text-sm font-bold text-purple-600 border-b-2 border-purple-600">
                Especificaciones
              </button>
              <button className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-600">
                Condiciones de venta
              </button>
            </nav>

            <form className="p-6 md:p-8 space-y-6" onSubmit={e => e.preventDefault()}>
              {/* Dynamic fields from CategoryFields */}
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

              {/* Actions */}
              <div className="flex flex-wrap gap-4 pt-4">
                <button type="submit" disabled={saving}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:opacity-90 transition-opacity disabled:opacity-60">
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button type="button" onClick={() => router.push("/perfil/ofrecer")}
                  className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
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
