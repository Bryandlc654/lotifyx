"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { MessageCircle, Wallet } from "lucide-react";
import { getCategories, getImageUrl, getProfile, isAuthenticated, removeTokens, Category } from "@/lib/api";

export default function OfrecerPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then((data) => {
        const u = data.user as any;
        const role = u.role?.name || "";
        setUserRole(role);
        if (role === "superadmin") { router.push("/perfil"); return; }
      })
      .catch(() => { removeTokens(); router.push("/"); });
    getCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f8fafc] flex items-start justify-center p- py-36 gap-20">
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
        <div className="w-full max-w-[900px] bg-white border border-slate-200 rounded-3xl shadow-sm p-8 md:p-16">
          {/* Step Indicator */}
          <nav aria-label="Progreso de creación" className="flex items-center justify-center mb-12">
            <div className="flex items-center">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm">1</span>
                <span className="font-semibold text-slate-900">Categoría</span>
              </div>
              <div className="h-[2px] w-16 md:w-24 bg-purple-500 mx-4"></div>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 font-bold text-sm border border-slate-200">2</span>
                <span className="font-medium text-slate-400">Detalles</span>
              </div>
              <div className="h-[2px] w-16 md:w-24 bg-slate-200 mx-4"></div>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 font-bold text-sm border border-slate-200">3</span>
                <span className="font-medium text-slate-400">Condiciones</span>
              </div>
            </div>
          </nav>

          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">¿Qué tipo de oferta quieres crear?</h1>
            <p className="text-slate-500 text-lg">Selecciona la categoría que mejor describa tu producto o servicio para empezar.</p>
          </header>

          {/* Category Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : (
            <section className="space-y-4">
              {categories.filter(c => c.status === "active").map(cat => (
                <article key={cat.id}
                  className="flex items-center justify-between p-6 border border-slate-100 rounded-xl hover:border-purple-200 hover:shadow-md transition-all cursor-pointer group bg-white shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 overflow-hidden">
                      {cat.icon ? (
                        <img src={getImageUrl(cat.icon)} alt={cat.name} className="w-full h-full object-contain p-2" />
                      ) : (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/perfil/ofrecer/detalles?categoria=${cat.id}&nombre=${encodeURIComponent(cat.name)}`)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    Seleccionar
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </article>
              ))}
              {categories.filter(c => c.status === "active").length === 0 && (
                <p className="text-center text-slate-400 py-8">No hay categorías disponibles</p>
              )}
            </section>
          )}

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-sm">
            <button onClick={() => router.push("/perfil")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium mb-4 md:mb-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al panel
            </button>
            <p className="text-slate-400">
              ¿No encuentras tu categoría?
              <a href="/contacto" className="text-purple-600 font-semibold hover:underline ml-1">Contacta con soporte</a>
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}

