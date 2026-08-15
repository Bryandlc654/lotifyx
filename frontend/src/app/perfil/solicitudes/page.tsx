"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, Pencil, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PerfilSidebar } from "@/components/layout/perfil-sidebar";
import { isAuthenticated, getProfile, removeTokens, getMyRequests, cancelRequest } from "@/lib/api";
import type { BuyerRequest } from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  abierta: { label: "Activa", cls: "bg-green-50 text-green-600" },
  aceptada: { label: "Cerrada", cls: "bg-blue-50 text-blue-600" },
  cancelada: { label: "Cancelada", cls: "bg-red-50 text-red-500" },
  expirada: { label: "Expirada", cls: "bg-slate-100 text-slate-500" },
};

function priceLabel(r: BuyerRequest) {
  const min = r.precio_minimo != null ? Number(r.precio_minimo) : null;
  const max = r.precio_maximo != null ? Number(r.precio_maximo) : null;
  if (min != null && max != null) return `S/ ${min.toFixed(2)} - S/ ${max.toFixed(2)}`;
  if (min != null) return `Desde S/ ${min.toFixed(2)}`;
  if (max != null) return `Hasta S/ ${max.toFixed(2)}`;
  return "A convenir";
}

export default function MisSolicitudesPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then(d => setUserRole(d.user?.role?.name || ""))
      .catch(() => { removeTokens(); router.push("/"); });
    getMyRequests()
      .then(setRequests)
      .catch(() => toast.error("Error al cargar tus solicitudes"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleCancel(r: BuyerRequest) {
    if (!window.confirm("¿Cancelar esta solicitud? Las ofertas pendientes quedarán rechazadas.")) return;
    try {
      await cancelRequest(r.id);
      toast.success("Solicitud cancelada");
      setRequests(await getMyRequests());
    } catch (e: any) {
      toast.error(e.message || "Error al cancelar");
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 md:px-8 pt-24 md:pt-40 pb-8 flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-12">
        <PerfilSidebar active="solicitudes" userRole={userRole} />
        <div className="max-w-4xl w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Mis Solicitudes</h1>
              <p className="text-sm text-slate-500">{requests.length} solicitud{requests.length !== 1 ? "es" : ""}</p>
            </div>
            <button
              onClick={() => router.push("/perfil/solicitudes/nueva")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8234FE] to-[#26BEFE] text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-md hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Nueva solicitud
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <p className="text-slate-500 text-sm mb-3">Aún no has publicado ninguna solicitud de compra.</p>
              <button onClick={() => router.push("/perfil/solicitudes/nueva")} className="text-sm text-[#8234FE] font-bold">
                Publicar mi primera solicitud
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(r => {
                const st = STATUS_CONFIG[r.estado] || STATUS_CONFIG.cancelada;
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                          {r.offers_count ? <span className="text-[10px] text-slate-400">{r.offers_count} oferta(s)</span> : null}
                        </div>
                        <h3 className="font-bold text-slate-900">{r.title}</h3>
                        <p className="text-xs text-slate-400 truncate max-w-md">{r.description || "Sin descripción"}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#8234FE]">{priceLabel(r)}</p>
                        <p className="text-[11px] text-slate-400">{r.cantidad} unid.</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                      <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(r.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => router.push(`/solicitudes/${r.id}`)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
                          <Eye className="w-3 h-3" /> Ver
                        </button>
                        {r.estado === "abierta" && (
                          <>
                            <button onClick={() => router.push(`/perfil/solicitudes/nueva?id=${r.id}`)} className="inline-flex items-center gap-1 text-xs font-bold text-[#8234FE] border border-primary-200 rounded-lg px-3 py-1.5 hover:bg-primary-50">
                              <Pencil className="w-3 h-3" /> Editar
                            </button>
                            <button onClick={() => handleCancel(r)} className="inline-flex items-center gap-1 text-xs font-bold text-red-500 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50">
                              <XCircle className="w-3 h-3" /> Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
