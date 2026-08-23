"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  registerManualPayment, getManualPayments, uploadConciliationTxt, getConciliation,
} from "@/lib/api/admin";
import { Receipt, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface Movement {
  id: string;
  movement_date: string | null;
  reference: string | null;
  description: string | null;
  amount: number | string;
  match_status: string;
  order_number?: string | null;
  raw_line?: string;
}

export default function ConciliacionPage() {
  const [manuals, setManuals] = useState<any[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [stats, setStats] = useState<{ total?: number; conciliados?: number; pendientes?: number }>({});
  const [sinRespaldo, setSinRespaldo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Formulario de pago manual
  const [orderId, setOrderId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [operationNumber, setOperationNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const loadAll = async () => {
    try {
      const [mp, rep] = await Promise.all([getManualPayments(), getConciliation()]);
      setManuals(mp);
      setMovements(rep.movements || []);
      setStats(rep.stats || {});
      setSinRespaldo(rep.pagos_sin_respaldo || []);
    } catch { /* noop */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  async function handleRegisterPayment() {
    if (!operationNumber.trim() && !orderId.trim()) { toast.error("Indica el número de operación o el ID del pedido"); return; }
    if (!amount.trim() || parseFloat(amount) <= 0) { toast.error("Ingresa un monto válido"); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (orderId.trim()) fd.append("order_id", orderId.trim());
      if (userEmail.trim()) fd.append("user_email", userEmail.trim());
      if (operationNumber.trim()) fd.append("operation_number", operationNumber.trim());
      fd.append("amount", amount);
      if (bank.trim()) fd.append("bank", bank.trim());
      if (notes.trim()) fd.append("notes", notes.trim());
      if (proofFile) fd.append("proof", proofFile);
      const res = await registerManualPayment(fd);
      toast.success(res.orderApproved ? "Pago registrado y pedido confirmado" : res.message || "Pago manual registrado");
      setOrderId(""); setUserEmail(""); setOperationNumber(""); setAmount(""); setBank(""); setNotes(""); setProofFile(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Error al registrar el pago");
    } finally { setSubmitting(false); }
  }

  async function handleImportTxt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await uploadConciliationTxt(file);
      toast.success(`${res.message}: ${res.conciliados} conciliados, ${res.pendientes} pendientes`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Error al importar el TXT");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagos manuales y Conciliación bancaria</h1>
        <p className="text-sm text-gray-500 mt-1">Registra pagos recibidos fuera del flujo normal y contrasta los depósitos del banco contra los pedidos.</p>
      </div>

      {/* Registro de pagos manuales */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-1"><Receipt className="w-5 h-5 text-purple-600" /> Registrar pago manual</h2>
        <p className="text-xs text-gray-500 mb-5">Registra una transferencia confirmada. Si asocias un pedido pendiente, se confirmará automáticamente.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="text-xs font-medium text-gray-600">ID del pedido (opcional)
            <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="UUID del pedido"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100" />
          </label>
          <label className="text-xs font-medium text-gray-600">Correo del pagador (opcional)
            <input value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="cliente@correo.com"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100" />
          </label>
          <label className="text-xs font-medium text-gray-600">N° de operación *
            <input value={operationNumber} onChange={e => setOperationNumber(e.target.value)} placeholder="Ej. 0023456"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100" />
          </label>
          <label className="text-xs font-medium text-gray-600">Monto (S/) *
            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100" />
          </label>
          <label className="text-xs font-medium text-gray-600">Banco (opcional)
            <input value={bank} onChange={e => setBank(e.target.value)} placeholder="BCP, Interbank..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100" />
          </label>
          <label className="text-xs font-medium text-gray-600">Comprobante (imagen opcional)
            <input type="file" accept="image/*" onChange={e => setProofFile(e.target.files?.[0] || null)}
              className="mt-1 w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-600 file:text-xs" />
          </label>
          <label className="text-xs font-medium text-gray-600 sm:col-span-2 lg:col-span-3">Nota (opcional)
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detalle del pago registrado"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100" />
          </label>
        </div>
        <button onClick={handleRegisterPayment} disabled={submitting}
          className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Registrar pago
        </button>

        {manuals.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Últimos pagos registrados</h3>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="py-2 pr-3">Fecha</th><th className="py-2 pr-3">Operación</th><th className="py-2 pr-3">Monto</th><th className="py-2 pr-3">Banco</th><th className="py-2 pr-3">Pedido</th><th className="py-2">Registrado por</th>
              </tr></thead>
              <tbody>
                {manuals.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 text-gray-700">
                    <td className="py-2 pr-3">{new Date(m.created_at).toLocaleString("es-PE")}</td>
                    <td className="py-2 pr-3">{m.operation_number || "-"}</td>
                    <td className="py-2 pr-3 font-semibold">S/ {Number(m.amount).toFixed(2)}</td>
                    <td className="py-2 pr-3">{m.bank || "-"}</td>
                    <td className="py-2 pr-3 max-w-[140px] truncate">{m.order_id ? `${m.order_id.slice(0, 8)}…` : "-"}</td>
                    <td className="py-2">{m.admin_email || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Conciliación bancaria */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-1"><Upload className="w-5 h-5 text-purple-600" /> Conciliación bancaria</h2>
        <p className="text-xs text-gray-500 mb-5">Sube el archivo TXT del estado de cuenta para contrastarlo contra los pedidos y pagos registrados.</p>
        <label className="inline-flex items-center gap-2 cursor-pointer bg-purple-50 text-purple-700 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-purple-100">
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Cargar archivo TXT bancario
          <input type="file" accept=".txt,text/plain" className="hidden" onChange={handleImportTxt} disabled={importing} />
        </label>

        {!loading && (
          <div className="grid grid-cols-3 gap-4 mt-6 max-w-md">
            <div className="rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total ?? 0}</p>
              <p className="text-[11px] text-gray-500">Movimientos</p>
            </div>
            <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700 flex items-center justify-center gap-1"><CheckCircle2 className="w-5 h-5" />{stats.conciliados ?? 0}</p>
              <p className="text-[11px] text-green-600">Conciliados</p>
            </div>
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-center">
              <p className="text-2xl font-bold text-orange-700 flex items-center justify-center gap-1"><AlertCircle className="w-5 h-5" />{stats.pendientes ?? 0}</p>
              <p className="text-[11px] text-orange-600">Pendientes</p>
            </div>
          </div>
        )}

        {movements.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Movimientos bancarios</h3>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="py-2 pr-3">Fecha</th><th className="py-2 pr-3">Referencia</th><th className="py-2 pr-3">Descripción</th><th className="py-2 pr-3">Monto</th><th className="py-2 pr-3">Estado</th><th className="py-2">Pedido</th>
              </tr></thead>
              <tbody>
                {movements.map(mv => (
                  <tr key={mv.id} className="border-b border-gray-50 text-gray-700">
                    <td className="py-2 pr-3">{mv.movement_date || "-"}</td>
                    <td className="py-2 pr-3">{mv.reference || "-"}</td>
                    <td className="py-2 pr-3 max-w-[240px] truncate" title={mv.raw_line}>{mv.description || "-"}</td>
                    <td className="py-2 pr-3 font-semibold">S/ {Number(mv.amount).toFixed(2)}</td>
                    <td className="py-2 pr-3">
                      {mv.match_status === "conciliado"
                        ? <span className="inline-flex items-center gap-1 text-green-600 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Conciliado</span>
                        : <span className="inline-flex items-center gap-1 text-orange-600 font-semibold"><AlertCircle className="w-3.5 h-3.5" /> Pendiente</span>}
                    </td>
                    <td className="py-2">{mv.order_number || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sinRespaldo.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <h3 className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Pedidos sin movimiento bancario que los respalde</h3>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="py-2 pr-3">N° Pedido</th><th className="py-2 pr-3">Operación</th><th className="py-2 pr-3">Monto</th><th className="py-2 pr-3">Estado</th><th className="py-2">Fecha</th>
              </tr></thead>
              <tbody>
                {sinRespaldo.map((o: any) => (
                  <tr key={o.id} className="border-b border-gray-50 text-gray-700">
                    <td className="py-2 pr-3">{o.order_number || o.id.slice(0, 8)}</td>
                    <td className="py-2 pr-3">{o.operation_number || "-"}</td>
                    <td className="py-2 pr-3 font-semibold">S/ {Number(o.amount ?? o.total_amount).toFixed(2)}</td>
                    <td className="py-2 pr-3">{o.status}</td>
                    <td className="py-2">{new Date(o.created_at).toLocaleDateString("es-PE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
