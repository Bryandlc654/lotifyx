"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  isAuthenticated, removeTokens, getProfile, authFetch,
  getBankAccounts,
} from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Wallet, HelpCircle, Clock, CheckCircle, XCircle, Download, Copy } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api";

export default function MisFondosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [funds, setFunds] = useState<any>({ available_balance: 0, pending_balance: 0, disputed_balance: 0 });
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawTotal, setWithdrawTotal] = useState(0);

  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then((data) => {
        const u = (data as any).user as any;
        setProfile(u);
        setUserRole(u?.role?.name || "");
        if (u?.role?.name !== "vendedor") { router.push("/perfil"); return; }
        return Promise.all([
          authFetch(`${API_URL}/checkout/funds`).then(r => r.json()),
          authFetch(`${API_URL}/checkout/funds/withdrawals`).then(r => r.json()),
          getBankAccounts(),
        ]);
      })
      .then(([f, w, ba]: any) => {
        setFunds(f);
        setWithdrawals(w.data || []);
        setWithdrawTotal(w.total || 0);
        setBankAccounts(ba || []);
      })
      .catch(() => { removeTokens(); router.push("/"); })
      .finally(() => setLoading(false));
  }, [router]);

  const total = Number(funds.available_balance) + Number(funds.pending_balance);
  const pctAvailable = total > 0 ? Math.round((Number(funds.available_balance) / total) * 100) : 0;
  const pctPending = total > 0 ? Math.round((Number(funds.pending_balance) / total) * 100) : 0;
  const dashArray = pctAvailable;



  function formatPrice(n: number) {
    return "S/ " + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const statusBadge: Record<string, { label: string; class: string }> = {
    pending: { label: "Pendiente", class: "bg-orange-100 text-orange-700" },
    approved: { label: "Aprobado", class: "bg-green-100 text-green-700" },
    rejected: { label: "Rechazado", class: "bg-red-100 text-red-700" },
    completed: { label: "Completado", class: "bg-emerald-100 text-emerald-700" },
  };

  if (loading) {
    return <><Header /><main className="pt-32 min-h-screen bg-[#F9FAFB] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></main><Footer /></>;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F9FAFB] p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800">Mis fondos</h1>
                <button className="text-slate-400 hover:text-slate-600">
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500">Administra y retira los fondos generados por tus ventas</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <HelpCircle className="w-5 h-5 text-indigo-500" />
              ¿Cómo funcionan mis fondos?
            </button>
          </header>

          {/* Main Balance */}
          <section className="relative bg-white border border-slate-100 rounded-2xl p-8 shadow-sm overflow-hidden">
            <div className="max-w-lg relative z-10">
              <h2 className="text-slate-700 font-semibold mb-1">Fondos disponibles para retiro</h2>
              <div className="text-4xl font-bold text-indigo-600 mb-2">{formatPrice(Number(funds.available_balance))}</div>
              <p className="text-sm text-slate-500 mb-6">Disponible para retirar</p>
              <button
                onClick={() => router.push("/perfil/mis-fondos/retirar")}
                disabled={Number(funds.available_balance) <= 0}
                className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Wallet className="w-5 h-5" />
                {Number(funds.available_balance) > 0 ? "Retirar fondos" : "Sin fondos disponibles"}
              </button>
            </div>
          </section>



          {/* Summary Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center relative overflow-hidden">
              <div>
                <div className="flex items-center gap-2 text-orange-600 font-medium text-sm mb-2">
                  <Clock className="w-4 h-4" />
                  Fondos en proceso
                </div>
                <div className="text-2xl font-bold text-slate-800">{formatPrice(Number(funds.pending_balance))}</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center relative overflow-hidden">
              <div>
                <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm mb-2">
                  <CheckCircle className="w-4 h-4" />
                  Disponibles
                </div>
                <div className="text-2xl font-bold text-slate-800">{formatPrice(Number(funds.available_balance))}</div>
              </div>
            </div>
          </section>

          {/* Distribution */}
          <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-8">Distribución de mis fondos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="transparent" stroke="#10B981" strokeDasharray={pctAvailable + ", 100"} strokeWidth="6" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="transparent" stroke="#F59E0B" strokeDasharray={pctPending + ", 100"} strokeDashoffset={-pctAvailable} strokeWidth="6" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-500">{pctAvailable}%</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Disponibles</p>
                      <p className="text-sm text-slate-500 font-medium">{formatPrice(Number(funds.available_balance))} ({pctAvailable}%)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mt-1"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">En proceso</p>
                      <p className="text-sm text-slate-500 font-medium">{formatPrice(Number(funds.pending_balance))} ({pctPending}%)</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-sm font-bold text-slate-800">Total</p>
                    <p className="text-sm text-slate-500 font-medium">{formatPrice(total)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Fondos en proceso</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Fondos retenidos mientras la compra continúa activa.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Fondos disponibles</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Fondos disponibles para retiro.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-center gap-6">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
              <HelpCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-blue-800 max-w-lg">
              Puedes dejar tus fondos disponibles dentro de la plataforma para futuras compras. Tú decides cuándo retirarlos.
            </p>
          </div>

          {/* Withdrawal history */}
          <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Historial de retiros</h2>
            </div>
            {withdrawals.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Wallet className="w-10 h-10 mx-auto mb-3" />
                <p className="text-sm">No has realizado retiros aún</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4">Monto</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Banco</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {withdrawals.map((w: any) => {
                      const st = statusBadge[w.status] || statusBadge.pending;
                      return (
                        <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-600">{new Date(w.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{formatPrice(w.amount)}</td>
                          <td className="px-6 py-4"><span className={"px-2.5 py-0.5 rounded-full text-xs font-medium " + st.class}>{st.label}</span></td>
                          <td className="px-6 py-4 text-slate-600">{w.bank_name || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
