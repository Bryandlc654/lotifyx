"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getBankAccounts, getProfile, isAuthenticated, removeTokens } from "@/lib/api";
import { Banknote, ChevronRight, Trash2, Building2, User, Hash, CreditCard } from "lucide-react";
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
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-compras")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Compras
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

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mis Cuentas Bancarias</h1>
            <p className="text-gray-500 text-sm mt-1">{accounts.length} cuenta{accounts.length !== 1 ? "s" : ""} registrada{accounts.length !== 1 ? "s" : ""}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Banknote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">No tienes cuentas registradas</h3>
              <p className="text-sm text-gray-500 mb-6">Registra una cuenta bancaria para poder realizar compras.</p>
              <button onClick={() => router.push("/checkout")}
                className="inline-block text-white font-semibold py-2 px-6 rounded-xl transition-opacity hover:opacity-90" style={{ background: "linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)" }}>
                Ir a registrar
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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
