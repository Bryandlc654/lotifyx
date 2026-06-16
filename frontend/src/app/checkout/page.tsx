"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { isAuthenticated, getAccessToken, getProfile } from "@/lib/api";

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [operationNumber, setOperationNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    getProfile()
      .then((data) => {
        const u = data.user as any;
        if (u?.role?.name !== "vendedor") { router.push("/perfil"); return; }
        if (!u?.profile?.plan_id) { router.push("/planes"); return; }
        setAuthorized(true);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleSaveBank() {
    if (!bankName || !accountNumber) { toast.error("Completa los campos"); return; }
    setSaving(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/bank-account`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` },
        body: JSON.stringify({ bank_name: bankName, account_number: accountNumber }),
      });
      toast.success("Cuenta guardada"); setStep(2);
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  }

  async function handleSubmitPayment() {
    if (!operationNumber || !amount) { toast.error("Completa los campos"); return; }
    setSaving(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/submit-payment`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` },
        body: JSON.stringify({ operation_number: operationNumber, amount: parseFloat(amount) }),
      });
      toast.success("Pago enviado. Pendiente de revisión."); router.push("/perfil");
    } catch { toast.error("Error al enviar"); }
    finally { setSaving(false); }
  }

  if (!authorized) {
    return (
      <>
        <Header />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-500 text-sm mb-8">Completa los pasos para activar tu plan</p>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
            <button onClick={() => setStep(step === 1 ? 0 : 1)}
              className="w-full flex items-center justify-between px-6 py-4 text-left">
              <span className="font-semibold text-gray-900">
                <span className="w-6 h-6 rounded-full bg-[#8234FE] text-white text-xs inline-flex items-center justify-center mr-2">1</span>Cuenta bancaria
              </span>
              <span className="text-gray-400 text-sm">{step > 1 ? "✓" : step === 1 ? "▼" : "▶"}</span>
            </button>
            {(step === 1 || step > 1) && (
              <div className="px-6 pb-6 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Banco</label>
                  <select value={bankName} onChange={e => setBankName(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200">
                    <option value="">Seleccionar banco</option>
                    <option value="BCP">BCP</option><option value="BBVA">BBVA</option>
                    <option value="Interbank">Interbank</option><option value="Scotiabank">Scotiabank</option>
                    <option value="Banco de la Nación">Banco de la Nación</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Número de cuenta</label>
                  <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                    placeholder="Ej. 123-4567890-1" className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                </div>
                {step === 1 && (
                  <button onClick={handleSaveBank} disabled={saving}
                    className="w-full rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-6 py-2.5 text-sm font-semibold text-white shadow-sm">
                    {saving ? "Guardando..." : "Guardar y continuar"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button onClick={() => step >= 2 ? setStep(step === 2 ? 0 : 2) : toast.error("Completa tu cuenta bancaria primero")}
              className="w-full flex items-center justify-between px-6 py-4 text-left">
              <span className={`font-semibold ${step < 2 ? "text-gray-400" : "text-gray-900"}`}>
                <span className={`w-6 h-6 rounded-full text-white text-xs inline-flex items-center justify-center mr-2 ${step >= 2 ? "bg-[#8234FE]" : "bg-gray-300"}`}>2</span>Datos del pago
              </span>
              <span className="text-gray-400 text-sm">{step === 2 ? "▼" : "▶"}</span>
            </button>
            {step === 2 && (
              <div className="px-6 pb-6 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Número de operación</label>
                  <input type="text" value={operationNumber} onChange={e => setOperationNumber(e.target.value)}
                    placeholder="Ej. 0012345678" className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Monto (S/)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="Ej. 59.00" className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Comprobante (foto/PDF)</label>
                  <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)}
                    className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm" />
                </div>
                <button onClick={handleSubmitPayment} disabled={saving}
                  className="w-full rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-6 py-2.5 text-sm font-semibold text-white shadow-sm">
                  {saving ? "Enviando..." : "Enviar comprobante"}
                </button>
                <p className="text-xs text-gray-400 text-center">Tu pago quedará pendiente hasta ser revisado.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
