"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useCart } from "@/lib/cart-context";
import { saveBankAccount, getBankAccounts, getImageUrl, isAuthenticated, submitCheckout, submitPlanPayment, getPlans, getProfile } from "@/lib/api";
import {
  Check, ArrowLeft, Lock, Shield, Clock, Banknote, LogIn,
  Building2, Plus, Copy, X, Upload, CheckCircle,
  AlertCircle, Moon, CreditCard,
} from "lucide-react";

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  account_type: string;
}

const COMPANY_BANK = {
  name: "Lotifyx Payments S.A.C.",
  ruc: "20601802295",
  bank: "BCP - Banco de Crédito del Perú",
  bankLogo: "https://upload.wikimedia.org/wikipedia/commons/9/96/BCP_logo.svg",
  accountType: "Cuenta Corriente Soles",
  accountNumber: "191-23456789-0",
  cci: "0021911234561232023494",
};

const bankLogos: Record<string, string> = {
  BCP: "https://upload.wikimedia.org/wikipedia/commons/9/96/BCP_logo.svg",
  BBVA: "https://upload.wikimedia.org/wikipedia/commons/4/4f/BBVA_logo.svg",
  Interbank: "https://upload.wikimedia.org/wikipedia/commons/8/84/Interbank_logo.svg",
  Scotiabank: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Scotiabank_logo.svg",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 text-[10px] text-purple-600 border border-purple-300 rounded px-2 py-0.5 hover:bg-purple-50 transition-colors"
    >
      {copied ? (
        <>Copiado</>
      ) : (
        <><Copy className="w-3 h-3" /> Copiar</>
      )}
    </button>
  );
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [showTransferView, setShowTransferView] = useState(false);

  const [bankName, setBankName] = useState("BCP");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountType, setAccountType] = useState("Cuenta bancaria");
  const [savedAccounts, setSavedAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  const [operationNumber, setOperationNumber] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [planMode, setPlanMode] = useState(false);
  const [planPrice, setPlanPrice] = useState(0);
  const [planName, setPlanName] = useState("");
  const [auctionMode, setAuctionMode] = useState(false);
  const [auctionGuarantee, setAuctionGuarantee] = useState(0);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  useEffect(() => {
    if (!authed) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("source") === "plan") {
      setPlanMode(true);
      getProfile().then(async (data) => {
        const u = data.user as any;
        const planId = u?.profile?.plan_id;
        if (planId) {
          try {
            const plans = await getPlans();
            const plan = plans.find((p: any) => p.id === planId);
            if (plan) {
              setPlanPrice(Number(plan.price));
              setPlanName(plan.name);
              setTransferAmount(String(plan.price));
            }
          } catch {}
        }
      }).catch(() => {});
    }
    if (url.searchParams.get("source") === "auction") {
      setAuctionMode(true);
      const amt = url.searchParams.get("amount");
      if (amt) {
        setAuctionGuarantee(parseFloat(amt));
        setTransferAmount(amt);
      }
    }
  }, [authed]);

  useEffect(() => {
    if (authed) {
      getBankAccounts()
        .then((data: BankAccount[]) => {
          setSavedAccounts(data);
          setAccountsLoaded(true);
        })
        .catch(() => toast.error("Error al cargar cuentas"));
    }
  }, [authed]);

  const total = items.reduce((sum, i) => sum + i.price, 0);

  const selectedAcc = savedAccounts.find(a => a.id === selectedAccount);

  async function handleSaveBankAccount() {
    if (!bankName || !accountNumber || !accountHolder) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    setSaving(true);
    try {
      const newAccount = await saveBankAccount({ bank_name: bankName, account_number: accountNumber, account_holder: accountHolder, account_type: accountType });
      toast.success("Cuenta bancaria guardada");
      setSavedAccounts(prev => [...prev, newAccount]);
      setSelectedAccount(newAccount.id);
      setShowForm(false);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitDeposit() {
    if (!selectedAccount) { toast.error("Selecciona tu cuenta de origen"); return; }
    if (!operationNumber.trim()) { toast.error("Ingresa el número de operación"); return; }
    if (!transferAmount.trim() || parseFloat(transferAmount) <= 0) { toast.error("Ingresa un monto válido"); return; }
    if (!proofFile) { toast.error("Sube el comprobante de transferencia"); return; }

    setSubmitting(true);
    try {
      if (planMode) {
        await submitPlanPayment({
          operation_number: operationNumber.trim(),
          amount: parseFloat(transferAmount),
          origin_account_id: selectedAccount,
          proof: proofFile,
        });
      } else {
        await submitCheckout({
          items: items.map(i => ({ id: i.id, price: i.price })),
          origin_account_id: selectedAccount,
          operation_number: operationNumber.trim(),
          amount: parseFloat(transferAmount),
          proof: proofFile,
        });
      }
      setShowSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Error al enviar depósito");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSuccessClose() {
    setShowSuccess(false);
    if (!planMode) clearCart();
    router.push(planMode ? "/perfil" : "/perfil/mis-compras");
  }

  if (authed === null) return null;

  if (!authed) {
    return (
      <>
        <Header />
        <main className="bg-[#F3F4F6] min-h-screen pt-24 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full mx-4 text-center">
            <LogIn className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Inicia sesión para continuar</h2>
            <p className="text-sm text-gray-500 mb-6">Debes iniciar sesión para poder realizar la compra.</p>
            <button onClick={() => router.push("/login?redirect=/checkout")}
              className="w-full text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90" style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
              Iniciar sesión
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (showTransferView) {
    return (
      <>
        <Header />
        <main className="bg-[#F3F4F6] min-h-screen pt-24">
          <div className="max-w-5xl mx-auto py-10 px-4">

            {/* Step Indicator */}
            <nav className="mb-12" data-purpose="checkout-steps">
              <div className="flex items-center justify-between relative max-w-2xl mx-auto">
                <div className="flex flex-col items-center z-10">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm">
                    <Check className="w-5 h-5" />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-gray-900">Elegir método de pago</p>
                  <p className="text-[10px] text-gray-500">Selección de modalidad</p>
                </div>
                <div className="h-0.5 flex-1 bg-purple-600 -mt-8"></div>
                <div className="flex flex-col items-center z-10">
                  <div className="w-8 h-8 rounded-full border-2 border-purple-600 bg-white flex items-center justify-center text-purple-600 font-bold text-sm">2</div>
                  <p className="mt-2 text-xs font-semibold text-gray-900">Transferencia Bancaria</p>
                  <p className="text-[10px] text-gray-500">{selectedAcc?.bank_name || "Banco"}</p>
                </div>
                <div className="h-0.5 flex-1 bg-gray-200 -mt-8"></div>
                <div className="flex flex-col items-center z-10">
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-400 font-bold text-sm">3</div>
                  <p className="mt-2 text-xs font-semibold text-gray-400">Finalizar compra</p>
                  <p className="text-[10px] text-gray-400">Confirmación</p>
                </div>
              </div>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Main */}
              <div className="lg:col-span-8">
                <button onClick={() => setShowTransferView(false)}
                  className="text-xs text-gray-500 flex items-center gap-1 mb-4 hover:text-gray-700">
                  <ArrowLeft className="w-3 h-3" />
                  Volver a método de pago
                </button>

                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Banknote className="w-6 h-6 text-purple-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">Realiza tu depósito</h1>
                </div>
                <p className="text-sm text-gray-500 mb-8">Transfiere el monto a la cuenta indicada para confirmar tu compra.</p>

                {/* 1. Purchase Summary */}
                <section className="mb-8" data-purpose="purchase-summary">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">1. Resumen de tu compra</h2>
                  <div className="space-y-3">
                    {planMode ? (
                      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="p-3 bg-purple-50 rounded-xl">
                          <CreditCard className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h3 className="text-sm font-semibold text-gray-800">Plan {planName}</h3>
                          <p className="text-xs text-gray-400">Activación de cuenta vendedor</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-400">Total a pagar</p>
                          <p className="text-lg font-bold text-gray-900">S/ {planPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    ) : (
                      items.map(item => (
                        <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="w-20 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin img</div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
                            {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-400">Total a pagar</p>
                            <p className="text-lg font-bold text-gray-900">S/ {item.price.toFixed(2)}</p>
                            {item.regularPrice && (
                              <p className="text-[10px] text-gray-300 line-through">S/ {item.regularPrice.toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* 2. Bank Details */}
                <section className="mb-8" data-purpose="bank-details">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">2. Transfiere a la siguiente cuenta</h2>
                  <p className="text-xs text-gray-500 mb-4">Realiza la transferencia exacta por el monto mostrado.</p>

                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-indigo-50 flex items-center justify-center rounded-xl text-purple-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">{COMPANY_BANK.name}</h4>
                            <p className="text-xs text-gray-400">RUC: {COMPANY_BANK.ruc}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-green-500" />
                          Entidad verificada
                        </span>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b border-gray-100 pb-3">
                          <span className="text-gray-500">Banco</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{COMPANY_BANK.bank}</span>
                            <img src={COMPANY_BANK.bankLogo} alt="BCP" className="h-4" />
                          </div>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-3">
                          <span className="text-gray-500">Tipo de cuenta</span>
                          <span className="font-medium text-gray-800 text-right">{COMPANY_BANK.accountType}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-3 items-center">
                          <span className="text-gray-500">Número de cuenta</span>
                          <div className="flex items-center gap-4">
                            <span className="font-medium text-gray-800">{COMPANY_BANK.accountNumber}</span>
                            <CopyButton text={COMPANY_BANK.accountNumber} />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">CCI</span>
                          <div className="flex items-center gap-4">
                            <span className="font-medium text-gray-800">{COMPANY_BANK.cci}</span>
                            <CopyButton text={COMPANY_BANK.cci} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 flex gap-3 items-start">
                      <AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        <span className="font-bold text-gray-800">Importante:</span> Transfiere el monto exacto para que tu pago sea identificado correctamente.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Moon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-900">Depósito BCP - Horario nocturno</p>
                        <p className="text-[10px] text-blue-700">Los depósitos de 9 p.m. a 12 a.m. demoran hasta 3 días hábiles en aprobarse.</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. Origin Account */}
                <section className="mb-8" data-purpose="origin-account">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">3. Desde qué cuenta realizas la transferencia</h2>
                  <p className="text-xs text-gray-500 mb-6">Selecciona tu cuenta de banco desde el que hiciste la transferencia e ingresa los datos solicitados.</p>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        Elegir una cuenta <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {savedAccounts.map(acc => (
                          <button
                            key={acc.id}
                            onClick={() => setSelectedAccount(selectedAccount === acc.id ? null : acc.id)}
                            className={`w-full flex items-center justify-between border rounded-lg p-3 transition-all text-left ${
                              selectedAccount === acc.id
                                ? "border-purple-500 bg-purple-50/30"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {bankLogos[acc.bank_name] ? (
                                <img src={bankLogos[acc.bank_name]} alt={acc.bank_name} className="h-5" />
                              ) : (
                                <Building2 className="h-5 w-5 text-gray-400" />
                              )}
                              <span className="text-sm text-gray-700">{acc.account_number}</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedAccount === acc.id ? "border-purple-500" : "border-gray-300"
                            }`}>
                              {selectedAccount === acc.id && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                            </div>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setShowForm(true)}
                        className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline">
                        <Plus className="w-3 h-3" /> Agregar cuenta
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Nº de operación <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={operationNumber}
                          onChange={e => setOperationNumber(e.target.value)}
                          className="w-full border-gray-200 rounded-lg text-sm p-3 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Ej. 124234"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Monto <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-gray-400">S/</span>
                          <input
                            value={transferAmount}
                            onChange={e => setTransferAmount(e.target.value)}
                            className="w-full pl-8 border-gray-200 rounded-lg text-sm p-3 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. File Upload */}
                <section className="mb-8" data-purpose="proof-upload">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">4. Sube el comprobante de transferencia</h2>
                  <p className="text-xs text-gray-500 mb-6">Adjuntar la imagen o captura de tu operación</p>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                      Comprobante <span className="text-red-500">*</span>
                    </label>

                    {!proofFile ? (
                      <div
                        onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50 cursor-pointer hover:border-purple-300 transition-colors"
                      >
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          Arrastra & suelta tu archivo o{' '}
                          <span className="text-purple-600 font-medium underline cursor-pointer">Haz clic para buscar</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">JPG, PNG o GIF. Máx 5 MB</p>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) setProofFile(f);
                        }} />
                      </div>
                    ) : (
                      <div className="bg-green-600 text-white rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{proofFile.name}</span>
                            <span className="text-[10px] opacity-80">{(proofFile.size / 1024).toFixed(0)} KB</span>
                          </div>
                        </div>
                        <button onClick={() => setProofFile(null)} className="bg-white/20 p-1 rounded-full hover:bg-white/30">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="bg-purple-50 p-4 flex gap-3 items-start rounded-xl">
                      <div className="p-1 bg-white rounded-md shadow-sm">
                        <AlertCircle className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-[11px] text-gray-600 leading-tight">
                        Verifica que en tu voucher o captura se visualicen el monto, la fecha, el número de operación y las cuentas de origen y destino.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <button
                    onClick={handleSubmitDeposit}
                    disabled={submitting}
                    className="text-white font-bold py-3 px-12 rounded-lg flex-grow shadow-lg shadow-purple-500/20 hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}
                  >
                    {submitting ? "Enviando..." : "Confirmar depósito"}
                  </button>
                  <button onClick={() => setShowTransferView(false)}
                    className="bg-slate-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-slate-700 transition-colors">
                    Regresar
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4">
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm sticky top-8" data-purpose="sidebar-info">
                  <h2 className="text-xl font-bold text-gray-800 mb-8">Pasos para completar tu pago</h2>

                  <div className="space-y-12 relative">
                    <div className="absolute left-6 top-8 w-0.5 h-48 bg-purple-200 -z-0"></div>

                    <div className="flex gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-purple-600 shrink-0">
                        <Banknote className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">1. Transfiere</h4>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">Realiza la transferencia desde tu banco o app de pago al número de cuenta indicado.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-purple-600 shrink-0">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">2. Sube tu comprobante</h4>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">Adjunta la captura o voucher de la operación realizada.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-purple-600 shrink-0">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">3. Validamos tu pago</h4>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">En cuanto validemos tu depósito, recibirás la confirmación de tu pedido por correo.</p>
                      </div>
                    </div>
                  </div>

                  <hr className="my-10 border-gray-100" />

                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      ¿Dudas? <span className="text-purple-600">Contáctanos</span>
                    </h3>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                      Ingresa <a href="/faqs" className="text-purple-600 underline">aquí</a> para ver las preguntas más frecuentes o contacta con nuestro equipo.
                    </p>
                    <a href="/contacto"
                      className="w-full block border border-purple-600 text-purple-600 font-bold py-3 px-4 rounded-xl hover:bg-purple-50 transition-colors">
                      Contactar soporte
                    </a>
                  </div>
                </div>
              </aside>

            </div>
          </div>
        </main>
        <Footer />

        {/* Add bank account modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Nueva Cuenta Bancaria</h2>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700">Tipo de cuenta <span className="text-red-500">*</span></label>
                  <select value={accountType} onChange={e => setAccountType(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-purple-500 focus:border-purple-500">
                    <option>Cuenta bancaria</option>
                    <option>Cuenta sueldo</option>
                    <option>Cuenta ahorros</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Banco <span className="text-red-500">*</span></label>
                  <select value={bankName} onChange={e => setBankName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-purple-500 focus:border-purple-500">
                    <option value="BCP">BCP - Banco de Crédito del Perú</option>
                    <option value="BBVA">BBVA</option>
                    <option value="Interbank">Interbank</option>
                    <option value="Scotiabank">Scotiabank</option>
                    <option value="Banco de la Nación">Banco de la Nación</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Número de cuenta <span className="text-red-500">*</span></label>
                  <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                    placeholder="Ej. 193-22122345-72"
                    className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-purple-500 focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Titular <span className="text-red-500">*</span></label>
                  <input type="text" value={accountHolder} onChange={e => setAccountHolder(e.target.value)}
                    placeholder="Ej. Juan Garcia Perez"
                    className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-purple-500 focus:border-purple-500" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleSaveBankAccount} disabled={saving}
                  className="flex-1 text-white font-bold py-3 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
                  {saving ? "Guardando..." : "Guardar cuenta"}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-slate-500 text-white font-bold rounded-lg hover:bg-slate-600">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success modal */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Depósito enviado!</h2>
              <p className="text-sm text-gray-500 mb-2">Tu comprobante fue recibido correctamente.</p>
              <p className="text-xs text-gray-400 mb-8">
                {planMode ? "Revisaremos tu pago y activaremos tu cuenta de vendedor." : "Revisaremos tu pago y te confirmaremos por correo electrónico."}
              </p>
              <button onClick={handleSuccessClose}
                className="w-full text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
                {planMode ? "Ir a mi perfil" : "Ir a mis compras"}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Step 1: Payment method selection
  return (
    <>
      <Header />
      <main className="bg-[#F3F4F6] min-h-screen pt-24">
        <div className="max-w-5xl mx-auto py-10 px-4">

          <nav aria-label="Progress" className="mb-12">
            <ol className="flex items-center w-full">
              <li className="flex flex-col items-start w-1/3 relative">
                <div className="flex items-center w-full">
                  <div className="w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-full z-10">
                    <Check className="h-5 w-5" />
                  </div>
                  <div className="h-0.5 flex-1 bg-purple-600"></div>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-gray-900">Elegir método de pago</p>
                  <p className="text-[10px] text-gray-500">Selección de modalidad de pago</p>
                </div>
              </li>
              <li className="flex flex-col items-start w-1/3 relative">
                <div className="flex items-center w-full">
                  <div className="w-8 h-8 flex items-center justify-center border-2 border-purple-600 bg-white text-purple-600 rounded-full z-10 text-xs font-bold">2</div>
                  <div className="h-0.5 flex-1 bg-gray-200"></div>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-gray-900">Transferencia Bancaria</p>
                  <p className="text-[10px] text-gray-500">Realiza el depósito</p>
                </div>
              </li>
              <li className="flex flex-col items-start relative">
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 bg-white text-gray-400 rounded-full z-10 text-xs font-bold">3</div>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-gray-400">Finalizar compra</p>
                  <p className="text-[10px] text-gray-400">Confirmación</p>
                </div>
              </li>
            </ol>
          </nav>

          <header className="mb-8 flex items-center gap-3">
            <Banknote className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Elige tu Método de Pago</h1>
              <p className="text-gray-500 text-sm">Selecciona tu cuenta bancaria para recibir el pago</p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-7 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-6">Selecciona el método para depositar el pago en soles</p>

              <div className="flex items-center p-4 rounded-xl border-2 border-green-500 bg-green-50/20 mb-6">
                <div className="p-2 bg-slate-100 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">Depósito con cuenta bancaria</p>
                  <p className="text-xs text-gray-500">Selecciona una cuenta registrada o agrega una nueva</p>
                </div>
                <div className="w-5 h-5 rounded-full border-4 border-green-500 bg-white"></div>
              </div>

              {accountsLoaded && savedAccounts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Selecciona tu cuenta de origen</h3>
                  <div className="space-y-3">
                    {savedAccounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => setSelectedAccount(selectedAccount === acc.id ? null : acc.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          selectedAccount === acc.id ? "border-purple-500 bg-purple-50/30" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center p-1.5 border border-gray-200 flex-shrink-0">
                          {bankLogos[acc.bank_name] ? (
                            <img src={bankLogos[acc.bank_name]} alt={acc.bank_name} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <Building2 className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-800">{acc.bank_name}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{acc.account_type}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{acc.account_number} · {acc.account_holder}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedAccount === acc.id ? "border-purple-500" : "border-gray-300"
                        }`}>
                          {selectedAccount === acc.id && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-all text-sm font-semibold">
                <Plus className="h-4 w-4" />
                Agregar nueva cuenta bancaria
              </button>

              <div className="mt-6">
                <button
                  onClick={() => {
                    if (!selectedAccount) { toast.error("Selecciona una cuenta bancaria"); return; }
                    setShowTransferView(true);
                  }}
                  disabled={!selectedAccount}
                  className={`w-full text-white font-bold py-3 rounded-xl transition-opacity ${
                    selectedAccount ? "hover:opacity-90" : "opacity-50 cursor-not-allowed"
                  }`} style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
                  Continuar
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center p-4 border border-slate-200 rounded-xl opacity-50 cursor-not-allowed">
                  <div className="p-2 bg-slate-100 rounded-lg mr-4">
                    <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Depósito con billetera digital</p>
                    <p className="text-xs text-gray-500">Próximamente</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-slate-300"></div>
                </div>
                <div className="flex items-center p-4 border border-slate-200 rounded-xl opacity-50 cursor-not-allowed">
                  <div className="p-2 bg-slate-100 rounded-lg mr-4">
                    <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Pagar con tarjeta de débito o crédito</p>
                    <p className="text-xs text-gray-500">Próximamente</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-slate-300"></div>
                </div>
              </div>
            </section>

            <section className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">{planMode ? "Plan seleccionado" : `Mis producto${items.length !== 1 ? "s" : ""}`}</h2>
                </div>

                {planMode ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-50 rounded-xl">
                        <CreditCard className="w-8 h-8 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-800">Plan {planName}</h3>
                        <p className="text-xs text-gray-400">Activación de cuenta vendedor</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Total</span>
                        <span className="text-lg font-bold text-gray-800">S/ {planPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400">
                    <p>No hay productos en tu carrito</p>
                    <button onClick={() => router.push("/categorias")} className="text-purple-600 hover:underline mt-2">Ir a comprar</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-24 h-16 bg-black rounded overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={getImageUrl(item.image)} alt={item.title} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-800">Sin img</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-bold text-gray-800 leading-tight">{item.title}</h3>
                          {item.sku && <p className="text-[10px] text-gray-400">Lot: {item.sku}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-800">S/ {item.price.toFixed(2)}</p>
                          {item.regularPrice && (
                            <p className="text-[10px] text-gray-400 line-through">S/ {item.regularPrice.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(items.length > 0 || planMode) && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="text-lg font-bold text-gray-800">S/ {planMode ? planPrice.toFixed(2) : total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />

      {/* Add bank account modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Nueva Cuenta Bancaria</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700">Tipo de cuenta <span className="text-red-500">*</span></label>
                <select value={accountType} onChange={e => setAccountType(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-purple-500 focus:border-purple-500">
                  <option>Cuenta bancaria</option>
                  <option>Cuenta sueldo</option>
                  <option>Cuenta ahorros</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Banco <span className="text-red-500">*</span></label>
                <select value={bankName} onChange={e => setBankName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-purple-500 focus:border-purple-500">
                  <option value="BCP">BCP - Banco de Crédito del Perú</option>
                  <option value="BBVA">BBVA</option>
                  <option value="Interbank">Interbank</option>
                  <option value="Scotiabank">Scotiabank</option>
                  <option value="Banco de la Nación">Banco de la Nación</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Número de cuenta <span className="text-red-500">*</span></label>
                <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                  placeholder="Ej. 193-22122345-72"
                  className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-purple-500 focus:border-purple-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Titular <span className="text-red-500">*</span></label>
                <input type="text" value={accountHolder} onChange={e => setAccountHolder(e.target.value)}
                  placeholder="Ej. Juan Garcia Perez"
                  className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-purple-500 focus:border-purple-500" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveBankAccount} disabled={saving}
                className="flex-1 text-white font-bold py-3 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
                {saving ? "Guardando..." : "Guardar cuenta"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-slate-500 text-white font-bold rounded-lg hover:bg-slate-600">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
