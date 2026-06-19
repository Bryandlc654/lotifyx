"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getPlans, Plan, getProfile, isAuthenticated, getAccessToken } from "@/lib/api";

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
        if (u?.profile?.plan_id) { router.push("/perfil"); return; }
        setUser(u);
        return getPlans();
      })
      .then((p) => { if (p) setPlans(p.filter(x => x.is_active)); })
      .catch(() => { router.push("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSelect(planId: string) {
    setSaving(planId);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/select-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ plan_id: planId }),
      });
      toast.success("¡Plan seleccionado!");
      router.push("/checkout?source=plan");
    } catch (e: any) {
      toast.error("Error al seleccionar plan");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-24 min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Activa tu cuenta de vendedor
          </h1>
          <p className="text-gray-500 mt-3 text-base max-w-lg mx-auto">
            Elige el plan que mejor se adapte a tu etapa comercial.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="relative text-left rounded-2xl border-2 border-[#C8D2DF] bg-[#FBF9FF] p-6 sm:p-8 hover:border-gray-400 transition-all"
              >
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    S/ {plan.price}
                    <span className="text-sm font-normal text-gray-400">/{plan.duration_days} días</span>
                  </p>
                </div>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-[#8234FE]/10 flex items-center justify-center text-[#8234FE] text-xs font-bold">✓</span>
                    {plan.max_products} producto{plan.max_products !== 1 ? "s" : ""}
                  </li>
                  {plan.max_featured > 0 && (
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-5 h-5 rounded-full bg-[#8234FE]/10 flex items-center justify-center text-[#8234FE] text-xs font-bold">✓</span>
                      {plan.max_featured} destacado{plan.max_featured !== 1 ? "s" : ""}
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handleSelect(plan.id)}
                  disabled={saving !== null}
                  className="mt-6 w-full rounded-xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving === plan.id ? "Activando..." : "Elegir plan"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
