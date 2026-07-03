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
import { Loader2, Wallet, HelpCircle, ChevronLeft, ChevronDown, Info, Plus, ArrowRight } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api";

export default function RetirarGarantiaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [funds, setFunds] = useState<any>({ available_balance: 0, pending_balance: 0, disputed_balance: 0 });
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ bank_name: "", account_number: "", account_holder: "" });
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
          getBankAccounts(),
        ]);
      })
      .then(([f, ba]: any) => {
        setFunds(f);
        setBankAccounts(ba || []);
        if (ba && ba.length > 0) {
          setSelectedAccount(ba[0]);
        }
      })
      .catch(() => { removeTokens(); router.push("/"); })
      .finally(() => setLoading(false));
  }, [router]);

  const formatPrice = (n: number) => {
    return "S/ " + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleWithdrawAll = () => {
    setAmount(funds.available_balance.toString());
  };

  const handleAddAccount = async () => {
    if (!newAccount.bank_name || !newAccount.account_number || !newAccount.account_holder) {
      toast.error("Completa todos los campos");
      return;
    }
    try {
      const res = await authFetch(`${API_URL}/auth/bank-accounts`, {
        method: "POST",
        body: JSON.stringify(newAccount),
      });
      if (!res.ok) throw new Error();
      toast.success("Cuenta bancaria agregada");
      const updatedAccounts = await getBankAccounts();
      setBankAccounts(updatedAccounts || []);
      setShowAddAccount(false);
      setNewAccount({ bank_name: "", account_number: "", account_holder: "" });
    } catch {
      toast.error("Error al agregar cuenta");
    }
  };

  const handleConfirmWithdrawal = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    if (parseFloat(amount) > funds.available_balance) {
      toast.error("Monto excede el saldo disponible");
      return;
    }
    if (!selectedAccount) {
      toast.error("Selecciona una cuenta bancaria");
      return;
    }
    setShowModal(true);
  };

  const handleSubmitWithdrawal = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`${API_URL}/checkout/funds/withdraw`, {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(amount),
          bank_name: selectedAccount.bank_name,
          account_number: selectedAccount.account_number,
          account_holder: selectedAccount.account_holder,
        }),
      });
      if (!res.ok) throw new Error();
      setShowModal(false);
      setShowSuccessModal(true);
    } catch {
      toast.error("Error al solicitar retiro");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <><Header /><main className="pt-32 min-h-screen bg-[#F9FAFB] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></main><Footer /></>;
  }

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-screen font-sans text-gray-800">
        <div className="max-w-5xl mx-auto p-6 md:p-10">
          {/* Top Navigation */}
          <nav className="flex justify-between items-center mb-8">
            <button
              onClick={() => router.push("/perfil/mis-fondos")}
              className="flex items-center text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver a Mis fondos
            </button>
            <button className="flex items-center px-4 py-2 border border-purple-200 rounded-full text-indigo-600 text-xs font-semibold bg-white hover:bg-purple-50 transition-colors shadow-sm">
              <span className="mr-2 flex items-center justify-center border border-indigo-600 rounded-full w-4 h-4 text-[10px]">?</span>
              ¿Cómo funcionan mis fondos?
            </button>
          </nav>

          {/* Header Title */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitar retiro de garantía</h1>
            <p className="text-gray-500 text-sm">Retira los fondos liberados de tus garantías hacia tu cuenta bancaria registrada.</p>
          </header>

          {/* Main Balance Card */}
          <section className="bg-white rounded-2xl p-8 mb-8 border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 font-semibold mb-2">Garantía liberada</h2>
              <p className="text-4xl font-bold text-indigo-600">{formatPrice(Number(funds.available_balance))}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-2xl">
              <Wallet className="w-8 h-8 text-indigo-600" />
            </div>
          </section>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Amount Input Section */}
            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-6">Monto a retirar</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monto <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm border-r pr-2">S/</span>
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-indigo-600 rounded-xl focus:ring-0 focus:border-indigo-600 text-gray-700 font-medium"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-400">Monto máximo disponible para retirar: {formatPrice(Number(funds.available_balance))}</p>
                </div>
                <button
                  onClick={handleWithdrawAll}
                  className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-400 to-blue-300 hover:opacity-90 transition-opacity mt-8"
                >
                  Retirar todo
                </button>
              </div>
            </section>

            {/* Bank Account Section */}
            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-6">Cuenta bancaria registrada</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Elegir una cuenta <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50">
                      <div className="flex items-center">
                        {selectedAccount ? (
                          <>
                            <span className="text-blue-700 font-black italic mr-2">{selectedAccount.bank_name}</span>
                            <span className="text-sm text-gray-600">{selectedAccount.account_number}</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">Selecciona una cuenta</span>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    {bankAccounts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                        {bankAccounts.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => setSelectedAccount(account)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center">
                              <span className="text-blue-700 font-black italic mr-2">{account.bank_name}</span>
                              <span className="text-sm text-gray-600">{account.account_number}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Titular: {account.account_holder}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {selectedAccount && (
                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/30">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Titular</p>
                    <p className="text-sm text-gray-600">{selectedAccount.account_holder}</p>
                  </div>
                )}
                <button
                  onClick={() => setShowAddAccount(!showAddAccount)}
                  className="flex items-center text-indigo-600 text-sm font-semibold hover:underline"
                >
                  <span className="w-4 h-4 border-2 border-indigo-600 rounded-full flex items-center justify-center mr-2 text-xs">+</span>
                  Agregar cuenta
                </button>
              </div>
            </section>
          </div>

          {/* Add Account Form */}
          {showAddAccount && (
            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
              <h3 className="font-bold text-gray-800 mb-6">Agregar nueva cuenta bancaria</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Banco <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newAccount.bank_name}
                    onChange={(e) => setNewAccount({ ...newAccount, bank_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="BCP, BBVA, etc"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número de cuenta <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newAccount.account_number}
                    onChange={(e) => setNewAccount({ ...newAccount, account_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="191-12345678"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Titular <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newAccount.account_holder}
                    onChange={(e) => setNewAccount({ ...newAccount, account_holder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="Nombre del titular"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button
                    onClick={handleAddAccount}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg text-sm font-semibold hover:opacity-90"
                  >
                    Guardar cuenta
                  </button>
                  <button
                    onClick={() => setShowAddAccount(false)}
                    className="px-6 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Important Info Box */}
          <section className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8 flex items-start">
            <div className="bg-blue-600 rounded-full p-1 mr-3 mt-0.5">
              <Info className="w-3 h-3 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 text-sm mb-2">Información importante</h4>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Solo se pueden retirar garantías con estado "Liberado"</li>
                <li>El procesamiento puede tomar entre 24 y 72 horas hábiles</li>
                <li>Recibirás una notificación cuando se procese tu solicitud.</li>
                <li>Puedes mantener estos fondos para futuras pujas o solicitudes.</li>
              </ul>
            </div>
          </section>

          {/* Summary Section */}
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Resumen del retiro</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Monto solicitado</span>
                <span className="font-medium text-gray-800">{amount ? formatPrice(parseFloat(amount)) : "S/ 0.00"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cuenta destino</span>
                <span className="font-medium text-gray-800">
                  {selectedAccount ? `${selectedAccount.bank_name} *****${selectedAccount.account_number.slice(-4)}` : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center text-gray-500">
                  Comisión
                  <span className="ml-1 flex items-center justify-center border border-gray-400 rounded-full w-3 h-3 text-[8px] cursor-help">i</span>
                </div>
                <span className="font-medium text-gray-800">S/ 0.00</span>
              </div>
            </div>
            <hr className="border-gray-100 mb-6" />
            <div className="flex justify-between items-center mb-8">
              <span className="text-lg font-bold text-gray-800">Total a recibir</span>
              <span className="text-xl font-bold text-gray-800">{amount ? formatPrice(parseFloat(amount)) : "S/ 0.00"}</span>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={handleConfirmWithdrawal}
                disabled={saving || !amount || parseFloat(amount) <= 0 || !selectedAccount}
                className="flex-grow flex items-center justify-center py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Confirmar retiro
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <button
                onClick={() => router.push("/perfil/mis-fondos")}
                className="md:w-1/4 py-4 rounded-xl font-bold text-white bg-slate-500 hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-lg relative p-8 md:p-10">
            <button
              onClick={() => router.push("/perfil/mis-fondos")}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicitud enviada</h1>
              <p className="text-gray-500 text-base leading-relaxed max-w-xs mx-auto">
                Tu solicitud de retiro de garantía fue registrada correctamente.
              </p>
            </div>
            <div className="space-y-4 mb-10">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-medium">Monto</span>
                <span className="text-gray-900 font-bold text-xl">{formatPrice(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-medium">Estado</span>
                <div className="bg-[#FFF9F2] border border-[#FFE8CC] px-3 py-1 rounded-md">
                  <span className="text-[#D97706] font-semibold text-sm">En proceso</span>
                </div>
              </div>
            </div>
            <div className="w-full">
              <button
                onClick={() => router.push("/perfil/mis-fondos")}
                className="w-full bg-[#6B778C] text-white font-semibold py-4 rounded-xl hover:bg-[#5A6577] transition-all duration-200 shadow-sm"
              >
                Ver historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-[650px] rounded-2xl p-8 shadow-lg">
            <header className="mb-8">
              <h1 className="text-2xl md:text-[28px] font-bold text-[#1e1b4b] tracking-tight">
                ¿Deseas retirar esta garantía?
              </h1>
            </header>
            <section className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-[15px]">
                <span className="text-gray-500 font-medium">Monto solicitado</span>
                <span className="text-[#1e1b4b] font-semibold">{amount ? formatPrice(parseFloat(amount)) : "S/ 0.00"}</span>
              </div>
              <div className="flex justify-between items-center text-[15px]">
                <span className="text-gray-500 font-medium">Cuenta destino</span>
                <span className="text-[#1e1b4b] font-semibold">
                  {selectedAccount ? `${selectedAccount.bank_name} *****${selectedAccount.account_number.slice(-4)}` : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[15px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-medium">Comisión</span>
                  <svg className="h-4 w-4 text-gray-500 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <span className="text-[#1e1b4b] font-semibold">S/ 0.00</span>
              </div>
            </section>
            <hr className="border-gray-200 mb-4" />
            <section className="flex justify-between items-center mb-10">
              <span className="text-lg font-bold text-[#1e1b4b]">Total a recibir</span>
              <span className="text-2xl font-bold text-[#1e1b4b]">{amount ? formatPrice(parseFloat(amount)) : "S/ 0.00"}</span>
            </section>
            <footer className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSubmitWithdrawal}
                disabled={saving}
                className="flex-1 py-4 rounded-xl font-semibold text-lg text-white flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar"}
                {!saving && <span className="text-xl">→</span>}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="w-full sm:w-32 py-4 rounded-xl font-semibold text-lg text-white bg-[#6b7280] hover:bg-slate-600 transition-colors"
              >
                Volver
              </button>
            </footer>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}