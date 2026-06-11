"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import { toast } from "sonner";
import { getPlans, Plan, getProfile, isAuthenticated, getAccessToken } from "@/lib/api";

export default function PlanesPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    getProfile()
      .then((data) => {
        const u = data.user as any;
        if (u?.role?.name !== "vendedor") { router.push("/perfil"); return; }
        if (u?.profile?.plan_id) { router.push("/perfil"); return; }
        return getPlans();
      })
      .then((p) => { if (p) setPlans(p.filter(x => x.is_active)); })
      .catch(() => { router.push("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSelect = async () => {
    if (!selected) { toast.error("Selecciona un plan"); return; }
    setSaving(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/select-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ plan_id: selected }),
      });
      toast.success("¡Plan activado!");
      router.push("/perfil");
    } catch (e: any) {
      toast.error("Error al seleccionar plan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Link
        href="/perfil"
        className="absolute top-4 left-4 z-10 p-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-gray-500 hover:text-primary-600 transition-all shadow-sm"
      >
        <Home className="h-5 w-5" />
      </Link>

      <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Activa tu cuenta de vendedor
        </h1>
        <p className="text-gray-500 mt-3 text-base max-w-lg mx-auto">
          Elige el plan que mejor se adapte a tu etapa comercial.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`relative text-left rounded-2xl border-2 p-6 sm:p-8 transition-all duration-200 hover:shadow-lg ${
                selected === plan.id
                  ? "border-[#8234FE] bg-[#FBF9FF] shadow-md"
                  : "border-[#C8D2DF] bg-[#FBF9FF] hover:border-gray-400"
              }`}
            >
              {plan.description && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8234FE] text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap max-w-[90%] truncate">
                  {plan.description}
                </span>
              )}

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
            </button>
          ))}
        </div>

        <button
          onClick={handleSelect}
          disabled={!selected || saving}
          className="mt-10 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-10 py-3.5 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          {saving ? "Activando..." : "Activar plan"}
        </button>
      </div>
    </main>
  );
}
