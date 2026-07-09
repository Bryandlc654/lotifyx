"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useCart } from "@/lib/cart-context";
import { getImageUrl, isAuthenticated, submitCheckout, submitPlanPayment, getPlans, getProfile } from "@/lib/api";
import { Check, ArrowLeft, Banknote, LogIn, Copy, CheckCircle, AlertCircle, Moon, CreditCard, Upload } from "lucide-react";
import { BankAccountSelector, PaymentForm } from "@/components/checkout";

const CB = { name: "Lotifyx Payments S.A.C.", ruc: "20601802295", bank: "BCP - Banco de Crédito del Perú", bankLogo: "https://upload.wikimedia.org/wikipedia/commons/9/96/BCP_logo.svg", accountType: "Cuenta Corriente Soles", accountNumber: "191-23456789-0", cci: "0021911234561232023494" };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1 text-[10px] text-purple-600 border border-purple-300 rounded px-2 py-0.5 hover:bg-purple-50 transition-colors">{copied ? <>Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}</button>;
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [showTransferView, setShowTransferView] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [opNum, setOpNum] = useState("");
  const [amount, setAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [planMode, setPlanMode] = useState(false);
  const [planPrice, setPlanPrice] = useState(0);
  const [planName, setPlanName] = useState("");
  const [auctionMode, setAuctionMode] = useState(false);
  const [auctionGuarantee, setAuctionGuarantee] = useState(0);
  const [pendingBidId, setPendingBidId] = useState<string | null>(null);

  useEffect(() => { setAuthed(isAuthenticated()); }, []);

  useEffect(() => {
    if (!authed) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("source") === "plan") {
      setPlanMode(true);
      getProfile().then(async (data) => {
        const u = data.user as any, planId = u?.profile?.plan_id;
        if (planId) { try { const plans = await getPlans(), plan = plans.find((p: any) => p.id === planId); if (plan) { setPlanPrice(Number(plan.price)); setPlanName(plan.name); setAmount(String(plan.price)); } } catch {} }
      }).catch(() => {});
    }
    if (url.searchParams.get("source") === "auction_bid") {
      setAuctionMode(true);
      const amt = url.searchParams.get("amount"), bidId = url.searchParams.get("bid_id");
      if (amt) { setAuctionGuarantee(parseFloat(amt)); setAmount(amt); }
      if (bidId) setPendingBidId(bidId);
    }
  }, [authed]);

  const total = items.reduce((sum, i) => sum + i.price, 0);

  async function handleSubmitDeposit() {
    if (!selectedAccount) { toast.error("Selecciona tu cuenta de origen"); return; }
    if (!opNum.trim()) { toast.error("Ingresa el número de operación"); return; }
    if (!amount.trim() || parseFloat(amount) <= 0) { toast.error("Ingresa un monto válido"); return; }
    if (!proofFile) { toast.error("Sube el comprobante de transferencia"); return; }
    setSubmitting(true);
    try {
      if (planMode) await submitPlanPayment({ operation_number: opNum.trim(), amount: parseFloat(amount), origin_account_id: selectedAccount, proof: proofFile });
      else if (auctionMode && pendingBidId) await submitCheckout({ items: [], origin_account_id: selectedAccount, operation_number: opNum.trim(), amount: parseFloat(amount), proof: proofFile, bid_id: pendingBidId });
      else await submitCheckout({ items: items.map(i => ({ id: i.id, price: i.price })), origin_account_id: selectedAccount, operation_number: opNum.trim(), amount: parseFloat(amount), proof: proofFile });
      setShowSuccess(true);
    } catch (err: any) { toast.error(err.message || "Error al enviar depósito"); }
    finally { setSubmitting(false); }
  }

  function handleSuccessClose() {
    setShowSuccess(false);
    if (!planMode && !auctionMode) clearCart();
    router.push(planMode ? "/perfil" : auctionMode ? "/perfil/mensajes" : "/perfil/mis-compras");
  }

  if (authed === null) return null;

  if (!authed) return <><Header /><main className="bg-[#F3F4F6] min-h-screen pt-24 flex items-center justify-center"><div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full mx-4 text-center"><LogIn className="h-12 w-12 text-purple-600 mx-auto mb-4" /><h2 className="text-xl font-bold text-gray-900 mb-2">Inicia sesión para continuar</h2><p className="text-sm text-gray-500 mb-6">Debes iniciar sesión para poder realizar la compra.</p><button onClick={() => router.push("/login?redirect=/checkout")} className="w-full text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90" style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>Iniciar sesión</button></div></main><Footer /></>;

  if (showTransferView) return <><Header /><main className="bg-[#F3F4F6] min-h-screen pt-24"><div className="max-w-5xl mx-auto py-10 px-4">
    <nav className="mb-12" data-purpose="checkout-steps"><div className="flex items-center justify-between relative max-w-2xl mx-auto">
      <div className="flex flex-col items-center z-10"><div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm"><Check className="w-5 h-5" /></div><p className="mt-2 text-xs font-semibold text-gray-900">Elegir método de pago</p><p className="text-[10px] text-gray-500">Selección de modalidad</p></div>
      <div className="h-0.5 flex-1 bg-purple-600 -mt-8"></div>
      <div className="flex flex-col items-center z-10"><div className="w-8 h-8 rounded-full border-2 border-purple-600 bg-white flex items-center justify-center text-purple-600 font-bold text-sm">2</div><p className="mt-2 text-xs font-semibold text-gray-900">Transferencia Bancaria</p><p className="text-[10px] text-gray-500">Banco</p></div>
      <div className="h-0.5 flex-1 bg-gray-200 -mt-8"></div>
      <div className="flex flex-col items-center z-10"><div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-400 font-bold text-sm">3</div><p className="mt-2 text-xs font-semibold text-gray-400">Finalizar compra</p><p className="text-[10px] text-gray-400">Confirmación</p></div>
    </div></nav>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8">
        <button onClick={() => setShowTransferView(false)} className="text-xs text-gray-500 flex items-center gap-1 mb-4 hover:text-gray-700"><ArrowLeft className="w-3 h-3" /> Volver a método de pago</button>
        <div className="flex items-center gap-2 mb-6"><div className="p-2 bg-purple-100 rounded-lg"><Banknote className="w-6 h-6 text-purple-600" /></div><h1 className="text-2xl font-bold text-gray-800">Realiza tu depósito</h1></div>
        <p className="text-sm text-gray-500 mb-8">Transfiere el monto a la cuenta indicada para confirmar tu compra.</p>

        <section className="mb-8" data-purpose="purchase-summary">
          <h2 className="text-lg font-bold text-gray-800 mb-4">1. Resumen de tu compra</h2>
          <div className="space-y-3">
            {planMode ? <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"><div className="p-3 bg-purple-50 rounded-xl"><CreditCard className="w-8 h-8 text-purple-600" /></div><div className="flex-grow min-w-0"><h3 className="text-sm font-semibold text-gray-800">Plan {planName}</h3><p className="text-xs text-gray-400">Activación de cuenta vendedor</p></div><div className="text-right flex-shrink-0"><p className="text-xs text-gray-400">Total a pagar</p><p className="text-lg font-bold text-gray-900">S/ {planPrice.toFixed(2)}</p></div></div>
              : auctionMode ? <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"><div className="p-3 bg-amber-50 rounded-xl"><svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" /><path d="m16 16 3.5 3.5c.83.83 2.17.83 3 0 0 0 0 0 0 0a2.12 2.12 0 0 0 0-3L19 13" /><path d="m15 11 3-3" /><path d="m8 4 3 3" /><path d="m2 2 16 16" /><path d="m2 11 9-9" /></svg></div><div className="flex-grow min-w-0"><h3 className="text-sm font-semibold text-gray-800">Garantía de subasta</h3><p className="text-xs text-gray-400">Reembolsable si no resultas ganador</p></div><div className="text-right flex-shrink-0"><p className="text-xs text-gray-400">Total a pagar</p><p className="text-lg font-bold text-gray-900">S/ {auctionGuarantee.toFixed(2)}</p></div></div>
              : items.map(item => <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"><div className="w-20 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">{item.image ? <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin img</div>}</div><div className="flex-grow min-w-0"><h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>{item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}</div><div className="text-right flex-shrink-0"><p className="text-xs text-gray-400">Total a pagar</p><p className="text-lg font-bold text-gray-900">S/ {item.price.toFixed(2)}</p>{item.regularPrice && <p className="text-[10px] text-gray-300 line-through">S/ {item.regularPrice.toFixed(2)}</p>}</div></div>)}
          </div>
        </section>

        <section className="mb-8" data-purpose="bank-details">
          <h2 className="text-lg font-bold text-gray-800 mb-2">2. Transfiere a la siguiente cuenta</h2>
          <p className="text-xs text-gray-500 mb-4">Realiza la transferencia exacta por el monto mostrado.</p>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4"><div className="w-12 h-12 bg-indigo-50 flex items-center justify-center rounded-xl text-purple-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg></div><div><h4 className="font-bold text-gray-800">{CB.name}</h4><p className="text-xs text-gray-400">RUC: {CB.ruc}</p></div></div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-green-500" /> Entidad verificada</span>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-gray-100 pb-3"><span className="text-gray-500">Banco</span><div className="flex items-center gap-2"><span className="font-medium">{CB.bank}</span><img src={CB.bankLogo} alt="BCP" className="h-4" /></div></div>
                <div className="flex justify-between border-b border-gray-100 pb-3"><span className="text-gray-500">Tipo de cuenta</span><span className="font-medium text-gray-800 text-right">{CB.accountType}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-3 items-center"><span className="text-gray-500">Número de cuenta</span><div className="flex items-center gap-4"><span className="font-medium text-gray-800">{CB.accountNumber}</span><CopyButton text={CB.accountNumber} /></div></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">CCI</span><div className="flex items-center gap-4"><span className="font-medium text-gray-800">{CB.cci}</span><CopyButton text={CB.cci} /></div></div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 flex gap-3 items-start"><AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" /><p className="text-[11px] text-gray-600 leading-relaxed"><span className="font-bold text-gray-800">Importante:</span> Transfiere el monto exacto para que tu pago sea identificado correctamente.</p></div>
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-full"><Moon className="w-4 h-4 text-blue-600" /></div><div><p className="text-xs font-bold text-blue-900">Depósito BCP - Horario nocturno</p><p className="text-[10px] text-blue-700">Los depósitos de 9 p.m. a 12 a.m. demoran hasta 3 días hábiles en aprobarse.</p></div></div></div>
        </section>

        <section className="mb-8" data-purpose="origin-account">
          <h2 className="text-lg font-bold text-gray-800 mb-2">3. Desde qué cuenta realizas la transferencia</h2>
          <p className="text-xs text-gray-500 mb-6">Selecciona tu cuenta e ingresa los datos solicitados.</p>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <BankAccountSelector selectedId={selectedAccount || ""} onChange={setSelectedAccount} />
            <PaymentForm operationNumber={opNum} amount={amount} onOperationNumberChange={setOpNum} onAmountChange={setAmount} onFileChange={setProofFile} file={proofFile} />
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button onClick={handleSubmitDeposit} disabled={submitting} className="text-white font-bold py-3 px-12 rounded-lg flex-grow shadow-lg shadow-purple-500/20 hover:opacity-90 transition-opacity disabled:opacity-60" style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>{submitting ? "Enviando..." : "Confirmar depósito"}</button>
          <button onClick={() => setShowTransferView(false)} className="bg-slate-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-slate-700 transition-colors">Regresar</button>
        </div>
      </div>

      <aside className="lg:col-span-4">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm sticky top-8" data-purpose="sidebar-info">
          <h2 className="text-xl font-bold text-gray-800 mb-8">Pasos para completar tu pago</h2>
          <div className="space-y-12 relative">
            <div className="absolute left-6 top-8 w-0.5 h-48 bg-purple-200 -z-0"></div>
            <div className="flex gap-4 relative z-10"><div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-purple-600 shrink-0"><Banknote className="w-6 h-6" /></div><div><h4 className="font-bold text-gray-800 text-sm">1. Transfiere</h4><p className="text-[11px] text-gray-500 mt-1 leading-relaxed">Realiza la transferencia desde tu banco o app de pago al número de cuenta indicado.</p></div></div>
            <div className="flex gap-4 relative z-10"><div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-purple-600 shrink-0"><Upload className="w-6 h-6" /></div><div><h4 className="font-bold text-gray-800 text-sm">2. Sube tu comprobante</h4><p className="text-[11px] text-gray-500 mt-1 leading-relaxed">Adjunta la captura o voucher de la operación realizada.</p></div></div>
            <div className="flex gap-4 relative z-10"><div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-purple-600 shrink-0"><CheckCircle className="w-6 h-6" /></div><div><h4 className="font-bold text-gray-800 text-sm">3. Validamos tu pago</h4><p className="text-[11px] text-gray-500 mt-1 leading-relaxed">En cuanto validemos tu depósito, recibirás la confirmación de tu pedido por correo.</p></div></div>
          </div>
          <hr className="my-10 border-gray-100" />
          <div className="text-center"><h3 className="text-lg font-bold text-gray-800 mb-2">¿Dudas? <span className="text-purple-600">Contáctanos</span></h3><p className="text-xs text-gray-400 mb-6 leading-relaxed">Ingresa <a href="/faqs" className="text-purple-600 underline">aquí</a> para ver las preguntas más frecuentes o contacta con nuestro equipo.</p><a href="/contacto" className="w-full block border border-purple-600 text-purple-600 font-bold py-3 px-4 rounded-xl hover:bg-purple-50 transition-colors">Contactar soporte</a></div>
        </div>
      </aside>
    </div>
  </div></main><Footer />
    {showSuccess && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"><div className="bg-white rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl text-center"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-green-600" /></div><h2 className="text-2xl font-bold text-gray-900 mb-2">¡Depósito enviado!</h2><p className="text-sm text-gray-500 mb-2">Tu comprobante fue recibido correctamente.</p><p className="text-xs text-gray-400 mb-8">{planMode ? "Revisaremos tu pago y activaremos tu cuenta de vendedor." : "Revisaremos tu pago y te confirmaremos por correo electrónico."}</p><button onClick={handleSuccessClose} className="w-full text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90" style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>{planMode ? "Ir a mi perfil" : "Ir a mis compras"}</button></div></div>}
  </>;

  return <><Header /><main className="bg-[#F3F4F6] min-h-screen pt-24"><div className="max-w-5xl mx-auto py-10 px-4">
    <nav aria-label="Progress" className="mb-12"><ol className="flex items-center w-full">
      <li className="flex flex-col items-start w-1/3 relative"><div className="flex items-center w-full"><div className="w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-full z-10"><Check className="h-5 w-5" /></div><div className="h-0.5 flex-1 bg-purple-600"></div></div><div className="mt-2"><p className="text-xs font-bold text-gray-900">Elegir método de pago</p><p className="text-[10px] text-gray-500">Selección de modalidad de pago</p></div></li>
      <li className="flex flex-col items-start w-1/3 relative"><div className="flex items-center w-full"><div className="w-8 h-8 flex items-center justify-center border-2 border-purple-600 bg-white text-purple-600 rounded-full z-10 text-xs font-bold">2</div><div className="h-0.5 flex-1 bg-gray-200"></div></div><div className="mt-2"><p className="text-xs font-bold text-gray-900">Transferencia Bancaria</p><p className="text-[10px] text-gray-500">Realiza el depósito</p></div></li>
      <li className="flex flex-col items-start relative"><div className="flex items-center"><div className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 bg-white text-gray-400 rounded-full z-10 text-xs font-bold">3</div></div><div className="mt-2"><p className="text-xs font-bold text-gray-400">Finalizar compra</p><p className="text-[10px] text-gray-400">Confirmación</p></div></li>
    </ol></nav>

    <header className="mb-8 flex items-center gap-3"><Banknote className="h-8 w-8 text-purple-600" /><div><h1 className="text-3xl font-bold text-gray-900">Elige tu Método de Pago</h1><p className="text-gray-500 text-sm">Selecciona tu cuenta bancaria para recibir el pago</p></div></header>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <section className="lg:col-span-7 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500 mb-6">Selecciona el método para depositar el pago en soles</p>
        <div className="flex items-center p-4 rounded-xl border-2 border-green-500 bg-green-50/20 mb-6">
          <div className="p-2 bg-slate-100 rounded-lg mr-4"><svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg></div>
          <div className="flex-1"><p className="text-sm font-bold text-gray-800">Depósito con cuenta bancaria</p><p className="text-xs text-gray-500">Selecciona una cuenta registrada o agrega una nueva</p></div>
          <div className="w-5 h-5 rounded-full border-4 border-green-500 bg-white"></div>
        </div>
        <BankAccountSelector selectedId={selectedAccount || ""} onChange={setSelectedAccount} />
        <div className="mt-6"><button onClick={() => { if (!selectedAccount) { toast.error("Selecciona una cuenta bancaria"); return; } setShowTransferView(true); }} disabled={!selectedAccount} className={`w-full text-white font-bold py-3 rounded-xl transition-opacity ${selectedAccount ? "hover:opacity-90" : "opacity-50 cursor-not-allowed"}`} style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>Continuar</button></div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center p-4 border border-slate-200 rounded-xl opacity-50 cursor-not-allowed">
            <div className="p-2 bg-slate-100 rounded-lg mr-4"><svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg></div>
            <div className="flex-1"><p className="text-sm font-bold text-gray-800">Depósito con billetera digital</p><p className="text-xs text-gray-500">Próximamente</p></div>
            <div className="w-5 h-5 rounded-full border border-slate-300"></div>
          </div>
          <div className="flex items-center p-4 border border-slate-200 rounded-xl opacity-50 cursor-not-allowed">
            <div className="p-2 bg-slate-100 rounded-lg mr-4"><svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg></div>
            <div className="flex-1"><p className="text-sm font-bold text-gray-800">Pagar con tarjeta de débito o crédito</p><p className="text-xs text-gray-500">Próximamente</p></div>
            <div className="w-5 h-5 rounded-full border border-slate-300"></div>
          </div>
        </div>
      </section>
      <section className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-800">{planMode ? "Plan seleccionado" : `Mis producto${items.length !== 1 ? "s" : ""}`}</h2></div>
          {planMode ? <div className="space-y-4"><div className="flex items-center gap-4"><div className="p-3 bg-purple-50 rounded-xl"><CreditCard className="w-8 h-8 text-purple-600" /></div><div className="flex-1"><h3 className="text-sm font-bold text-gray-800">Plan {planName}</h3><p className="text-xs text-gray-400">Activación de cuenta vendedor</p></div></div><div className="mt-4 pt-4 border-t border-gray-100"><div className="flex justify-between items-center"><span className="text-sm text-gray-500">Total</span><span className="text-lg font-bold text-gray-800">S/ {planPrice.toFixed(2)}</span></div></div></div>
            : items.length === 0 ? <div className="text-center py-8 text-sm text-gray-400"><p>No hay productos en tu carrito</p><button onClick={() => router.push("/categorias")} className="text-purple-600 hover:underline mt-2">Ir a comprar</button></div>
            : <div className="space-y-4">{items.map(item => <div key={item.id} className="flex gap-4"><div className="w-24 h-16 bg-black rounded overflow-hidden flex-shrink-0">{item.image ? <img src={getImageUrl(item.image)} alt={item.title} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-800">Sin img</div>}</div><div className="flex-1 min-w-0"><h3 className="text-xs font-bold text-gray-800 leading-tight">{item.title}</h3>{item.sku && <p className="text-[10px] text-gray-400">Lot: {item.sku}</p>}</div><div className="text-right flex-shrink-0"><p className="text-sm font-bold text-gray-800">S/ {item.price.toFixed(2)}</p>{item.regularPrice && <p className="text-[10px] text-gray-400 line-through">S/ {item.regularPrice.toFixed(2)}</p>}</div></div>)}</div>}
          {(items.length > 0 || planMode || auctionMode) && <div className="mt-6 pt-4 border-t border-gray-100"><div className="flex justify-between items-center"><span className="text-sm text-gray-500">Total</span><span className="text-lg font-bold text-gray-800">S/ {planMode ? planPrice.toFixed(2) : auctionMode ? auctionGuarantee.toFixed(2) : total.toFixed(2)}</span></div></div>}
        </div>
      </section>
    </div>
  </div></main><Footer /></>;
}
