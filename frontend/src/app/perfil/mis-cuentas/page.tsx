"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getBankAccounts, saveBankAccount, updateBankAccount, deleteBankAccount, getProfile, isAuthenticated, removeTokens } from "@/lib/api";
import { Banknote, ChevronRight, Pencil, Trash2, Building2, User, Hash, X, MessageCircle, Wallet } from "lucide-react";
import { toast } from "sonner";

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  account_type: string;
  created_at: string;
}

export default function MisCuentasPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [editTarget, setEditTarget] = useState<BankAccount | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ bank_name: "BCP", account_number: "", account_holder: "", account_type: "Cuenta bancaria" });
  const router = useRouter();

  function loadAccounts() {
    getBankAccounts()
      .then(setAccounts)
      .catch(() => toast.error("Error al cargar cuentas"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then((data) => {
        const u = data.user as any;
        setUserRole(u.role?.name || "");
      })
      .catch(() => { removeTokens(); router.push("/"); });
    loadAccounts();
  }, [router]);

  function openEdit(acc: BankAccount) {
    setEditTarget(acc);
    setForm({
      bank_name: acc.bank_name,
      account_number: acc.account_number,
      account_holder: acc.account_holder,
      account_type: acc.account_type,
    });
  }

  async function handleSave() {
    if (!form.bank_name || !form.account_number || !form.account_holder) {
      toast.error("Completa todos los campos");
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await updateBankAccount(editTarget.id, form);
        toast.success("Cuenta actualizada");
      } else {
        const newAcc = await saveBankAccount(form);
        toast.success("Cuenta agregada");
        setAccounts(prev => [newAcc, ...prev]);
      }
      setEditTarget(null);
      if (editTarget) loadAccounts();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(acc: BankAccount) {
    if (!confirm(`¿Eliminar la cuenta ${acc.bank_name} - ${acc.account_number}?`)) return;
    try {
      await deleteBankAccount(acc.id);
      toast.success("Cuenta eliminada");
      setAccounts(prev => prev.filter(a => a.id !== acc.id));
    } catch {
      toast.error("Error al eliminar");
    }
  }

  const bankLogos: Record<string, string> = {
    BCP: "https://upload.wikimedia.org/wikipedia/commons/9/96/BCP_logo.svg",
    BBVA: "https://upload.wikimedia.org/wikipedia/commons/4/4f/BBVA_logo.svg",
    Interbank: "https://upload.wikimedia.org/wikipedia/commons/8/84/Interbank_logo.svg",
    Scotiabank: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Scotiabank_logo.svg",
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 md:px-8 pt-24 md:pt-40 pb-8 flex items-start justify-center gap-32">
        <nav className="w-44 flex-shrink-0 pt-8 space-y-1">
          <button onClick={() => router.push("/perfil")}
            className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
            Editar Perfil
          </button>
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/dashboard")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Dashboard
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-compras")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Compras
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mensajes")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mensajes
            </button>
          )}
          <button onClick={() => router.push("/perfil/mis-cuentas")}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 border-l-2 border-slate-700 -ml-px">
            Mis Cuentas
          </button>
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-ventas")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Ventas
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-fondos")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Fondos
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/carga-masiva")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Carga Masiva
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-productos")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Productos
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/ofrecer")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Ofrecer
            </button>
          )}
        </nav>

        <div className="max-w-4xl w-full">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">Inicio</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <button onClick={() => router.push("/perfil")} className="text-gray-400 hover:text-gray-600">Perfil</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-[#8234FE] font-semibold">Mis Cuentas</span>
          </nav>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Cuentas Bancarias</h1>
              <p className="text-gray-500 text-sm mt-1">{accounts.length} cuenta{accounts.length !== 1 ? "s" : ""} registrada{accounts.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={() => {
              setEditTarget(null);
              setForm({ bank_name: "BCP", account_number: "", account_holder: "", account_type: "Cuenta bancaria" });
            }}
              className="text-white font-semibold py-2 px-4 rounded-xl text-sm transition-opacity hover:opacity-90" style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
              + Nueva cuenta
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : accounts.length === 0 && !editTarget ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Banknote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">No tienes cuentas registradas</h3>
              <p className="text-sm text-gray-500 mb-6">Registra una cuenta bancaria para poder realizar compras.</p>
              <button onClick={() => {
      setEditTarget(undefined);
                setForm({ bank_name: "BCP", account_number: "", account_holder: "", account_type: "Cuenta bancaria" });
              }}
                className="inline-block text-white font-semibold py-2 px-6 rounded-xl transition-opacity hover:opacity-90" style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
                Agregar cuenta
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((acc) => (
                <div key={acc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5">
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center p-2 border border-gray-200">
                    {bankLogos[acc.bank_name] ? (
                      <img src={bankLogos[acc.bank_name]} alt={acc.bank_name} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <Building2 className="h-7 w-7 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">{acc.bank_name}</span>
                      <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">{acc.account_type}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5" />
                        {acc.account_number}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {acc.account_holder}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(acc)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-purple-600 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(acc)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form section - always visible when adding/editing */}
          {editTarget !== undefined && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="font-bold text-gray-800 mb-4">{editTarget ? "Editar cuenta" : "Nueva cuenta bancaria"}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700">Tipo de cuenta</label>
                  <select value={form.account_type} onChange={e => setForm({ ...form, account_type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-purple-500">
                    <option>Cuenta bancaria</option>
                    <option>Cuenta sueldo</option>
                    <option>Cuenta ahorros</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Banco</label>
                  <select value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-purple-500">
                    <option value="BCP">BCP - Crédito del Perú</option>
                    <option value="BBVA">BBVA</option>
                    <option value="Interbank">Interbank</option>
                    <option value="Scotiabank">Scotiabank</option>
                    <option value="Banco de la Nación">Banco de la Nación</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Número de cuenta</label>
                  <input type="text" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })}
                    placeholder="Ej. 193-22122345-72"
                    className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Titular</label>
                  <input type="text" value={form.account_holder} onChange={e => setForm({ ...form, account_holder: e.target.value })}
                    placeholder="Ej. Juan Garcia"
                    className="w-full border border-gray-200 rounded-lg text-sm p-3 mt-1 focus:ring-purple-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleSave} disabled={saving}
                  className="text-white font-bold py-2 px-6 rounded-lg text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
                  {saving ? "Guardando..." : editTarget ? "Actualizar" : "Agregar cuenta"}
                </button>
                <button onClick={() => setEditTarget(undefined)}
                  className="px-6 py-2 bg-gray-500 text-white font-bold rounded-lg text-sm hover:bg-gray-600">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

