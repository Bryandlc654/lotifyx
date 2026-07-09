"use client";
import { useEffect, useState } from "react";
import { getBankAccounts, saveBankAccount } from "@/lib/api";
import { Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  account_type: string;
}

interface Props {
  selectedId: string;
  onChange: (id: string) => void;
}

export function BankAccountSelector({ selectedId, onChange }: Props) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bank_name: "", account_number: "", account_holder: "" });

  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    try { setAccounts(await getBankAccounts()); } catch {}
  }

  async function handleSave() {
    try {
      const acct = await saveBankAccount(form);
      toast.success("Cuenta agregada");
      setShowForm(false);
      setForm({ bank_name: "", account_number: "", account_holder: "" });
      loadAccounts();
      onChange(acct.id || acct[0]?.id);
    } catch { toast.error("Error al guardar cuenta"); }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Cuenta de origen</h3>
      {accounts.map((acct) => (
        <button key={acct.id} onClick={() => onChange(acct.id)}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedId === acct.id ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-semibold text-sm">{acct.bank_name}</p>
              <p className="text-xs text-gray-500">{acct.account_type} &bull; {acct.account_number.slice(-4).padStart(acct.account_number.length, "*")}</p>
              <p className="text-xs text-gray-400">{acct.account_holder}</p>
            </div>
          </div>
        </button>
      ))}
      {showForm ? (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="Nombre del banco"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} placeholder="Número de cuenta"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })} placeholder="Titular"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700">Guardar</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 text-purple-600 text-sm font-medium hover:text-purple-700">
          <Plus className="w-4 h-4" /> Agregar otra cuenta
        </button>
      )}
    </div>
  );
}
