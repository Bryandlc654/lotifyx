"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getMyPlan, isAuthenticated, removeTokens, getProfile } from "@/lib/api";
import { Crown, Calendar, CheckCircle, AlertCircle, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function MiPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    Promise.all([getMyPlan(), getProfile()])
      .then(([plan, prof]) => {
        setCurrentPlan(plan);
        const u = (prof as any).user as any;
        setProfile(u);
        setUserRole(u?.role?.name || "");
      }).catch(() => { removeTokens(); router.push("/"); })
      .finally(() => setLoading(false));
  }, [router]);

  function daysLeft(endsAt: string) {
    const diff = new Date(endsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-32 min-h-screen bg-[#f5f6f8] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </main>
        <Footer />
      </>
    );
  }

  const isVendedor = (profile as any)?.role?.name === "vendedor" || (profile as any)?.profile?.account_type === "Quiero vender";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f5f6f8]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-28 pb-8 flex items-start justify-center gap-32">
          <nav className="w-44 flex-shrink-0 pt-8 space-y-1 hidden md:block">
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
                className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
                Ofrecer
              </button>
            )}
            {userRole === "vendedor" && (
              <button onClick={() => router.push("/perfil/mi-plan")}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 border-l-2 border-slate-700 -ml-px">
                Mi Plan
              </button>
            )}
          </nav>
          <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Plan</h1>
              <p className="text-sm text-gray-500">Gestiona tu suscripción y planes</p>
            </div>
          </div>

          {!isVendedor ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
              <Crown className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">Eres comprador</h2>
              <p className="text-sm text-gray-500">Los planes están disponibles solo para vendedores.</p>
            </div>
          ) : (
            <>
              {/* Current Plan */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Plan actual</p>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {currentPlan?.name || "Sin plan activo"}
                    </h2>
                    {currentPlan && (
                      <p className="text-sm text-gray-500 mt-1">
                        ${Number(currentPlan.price).toFixed(2)} — {currentPlan.max_products} productos, {currentPlan.max_featured || 0} destacados
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${currentPlan ? "bg-green-50" : "bg-gray-50"}`}>
                      {currentPlan ? <CheckCircle className="h-7 w-7 text-green-600" /> : <AlertCircle className="h-7 w-7 text-gray-400" />}
                    </div>
                  </div>
                </div>

                {currentPlan ? (
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {new Date(currentPlan.starts_at).toLocaleDateString("es-PE")} — {new Date(currentPlan.ends_at).toLocaleDateString("es-PE")}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${daysLeft(currentPlan.ends_at) > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {daysLeft(currentPlan.ends_at) > 0 ? `${daysLeft(currentPlan.ends_at)} días restantes` : "Vencido"}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${currentPlan.payment_status === "completed" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                      Pago: {currentPlan.payment_status === "completed" ? "Completado" : "Pendiente"}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">Selecciona un plan para empezar a vender.</p>
                )}

                <button onClick={() => router.push("/planes")} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm">
                  {currentPlan ? "Cambiar de plan" : "Elegir plan"}
                </button>
              </div>


            </>
          )}
        </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
