"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getPlans, Plan, getProfile, isAuthenticated, getAccessToken } from "@/lib/api";
import { Zap, Loader2, Star, Check } from "lucide-react";

export default function PlanesPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    getProfile()
      .then((data) => {
        const u = data.user as any;
        if (u?.role?.name !== "vendedor") { router.push("/perfil"); return; }
        setUser(u);
        return getPlans();
      })
      .then((p) => { if (p) setPlans(p.filter(x => x.is_active)); })
      .catch(() => { router.push("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSelect(planId: string, price: number) {
    setSaving(planId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/select-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` },
        body: JSON.stringify({ plan_id: planId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
      toast.success("¡Plan seleccionado!");
      router.push("/checkout?source=plan");
    } catch (e: any) {
      toast.error("Error al seleccionar plan");
    } finally {
      setSaving(null);
    }
  }

  const icons = [Zap, Star, Zap, Star];

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-24 min-h-screen flex items-center justify-center bg-[#fcfcfd]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-[#fcfcfd] text-slate-800 antialiased">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          {/* Header */}
          <header className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-slate-100 shadow-sm mb-6">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-[#8234FE] to-[#26BEFE]" />
                ))}
              </div>
              <span className="text-xs font-medium text-slate-500">Empieza a vender en Lotifyx</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1e293b] mb-4 tracking-tight">
              ACTIVA TU CUENTA DE VENDEDOR
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              Elige el plan que mejor se adapte a tu etapa comercial.
            </p>
          </header>

          {/* Pricing Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 items-stretch">
            {plans.map((plan, idx) => {
              const Icon = icons[idx] || Zap;
              const isFree = plan.price === 0;
              const isGrowth = idx === 2; // Tercer plan = featured

              return (
                <div key={plan.id} className={`relative bg-white border ${isGrowth ? "border-[3px] border-purple-500 shadow-growth scale-[1.02] z-10" : "border-slate-200"} rounded-[2.5rem] p-8 flex flex-col transition-all hover:shadow-lg`}>
                  {isGrowth && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                      <Check className="w-3 h-3" />
                      Más elegido
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold tracking-widest text-slate-800 uppercase">{plan.name}</span>
                    <div className="bg-purple-50 p-2 rounded-full">
                      <Icon className="w-5 h-5 text-purple-500" />
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-extrabold">S/ {plan.price}</span>
                    <span className="text-slate-400 text-sm italic font-normal">
                      {isFree ? "/gratuito" : plan.commission > 0 ? `+${plan.commission}%` : `/${plan.duration_days} días`}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs mb-8">
                    {isFree ? "Sin comisión (solo publica, no cobra)" : `Solo pagas cuando vendas`}
                  </p>

                  <button
                    onClick={() => handleSelect(plan.id, plan.price)}
                    disabled={saving !== null}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold mb-8 transition-all ${
                      isGrowth
                        ? "bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] text-white font-bold shadow-md hover:opacity-90"
                        : "border border-slate-100 bg-slate-50 text-slate-800 hover:bg-slate-100"
                    } disabled:opacity-50`}
                  >
                    {saving === plan.id ? "Activando..." : "Elegir plan"}
                  </button>

                  <div className="border-t border-dashed border-slate-200 pt-8 mt-auto">
                    <p className="text-[10px] font-bold tracking-widest text-slate-800 uppercase mb-4">Lo que incluye:</p>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3 text-xs text-slate-600">
                        <svg className="w-4 h-4 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
                        Publicación destacada
                      </li>
                      <li className="flex items-center gap-3 text-xs text-slate-600 pt-4 border-t border-slate-50">
                        <span className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                        Hasta {plan.max_products} producto{plan.max_products !== 1 ? "s" : ""} activo{plan.max_products !== 1 ? "s" : ""}
                      </li>
                      {plan.max_featured > 0 && (
                        <li className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                          {plan.max_featured} destacado{plan.max_featured !== 1 ? "s" : ""}
                        </li>
                      )}
                      <li className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                        {isFree ? "Para probar la plataforma" : "Venta directa"}
                      </li>
                    </ul>
                  </div>

                  {isGrowth && (
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-start gap-2">
                      <svg className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                      <p className="text-[9px] text-slate-400 leading-relaxed italic">Plan sugerido para la mayoría de vendedores</p>
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* Info Section */}
          <section className="relative bg-white border border-slate-100 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }} />
            <div className="relative flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-3">
                ¿Cómo subir de plan?
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
                Cuando acumulas ventas o volumen mensual, el sistema te ofrece el upgrade automático. 
                Al subir de plan ahorras en comisiones. Si vendes S/ 3,000/mes, eso es dinero que se queda en tu bolsillo.
              </p>
            </div>
            <div className="relative shrink-0">
              <Link href="/ayuda" className="inline-block bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-opacity">
                Conoce más
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
