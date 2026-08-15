"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Clock } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PerfilSidebar } from "@/components/layout/perfil-sidebar";
import { isAuthenticated, getProfile, removeTokens, getMyOffers } from "@/lib/api";
import type { RequestOffer } from "@/lib/api";

function offerStatus(o: RequestOffer) {
  if (o.estado === "aceptada") return { label: "Aceptada", cls: "bg-green-50 text-green-600" };
  if (o.estado === "rechazada") return { label: "Rechazada", cls: "bg-slate-100 text-slate-500" };
  return { label: "Pendiente", cls: "bg-amber-50 text-amber-600" };
}

export default function MisOfertasPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [offers, setOffers] = useState<RequestOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then(d => setUserRole(d.user?.role?.name || ""))
      .catch(() => { removeTokens(); router.push("/"); });
    getMyOffers()
      .then(setOffers)
      .catch(() => toast.error("Error al cargar tus ofertas"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 md:px-8 pt-24 md:pt-40 pb-8 flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-12">
        <PerfilSidebar active="ofertas" userRole={userRole} />
        <div className="max-w-4xl w-full">
          <div className="mb-6">
            <h1 className="text-xl font-extrabold text-slate-900">Mis Ofertas</h1>
            <p className="text-sm text-slate-500">Ofertas que enviaste a solicitudes de compra</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : offers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <p className="text-slate-500 text-sm mb-3">Aún no has enviado ofertas.</p>
              <button onClick={() => router.push("/solicitudes")} className="text-sm text-[#8234FE] font-bold">
                Ver solicitudes de compra
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map(o => {
                const st = offerStatus(o);
                return (
                  <div key={o.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        <h3 className="font-bold text-slate-900 mt-1">{o.request?.title || "Solicitud"}</h3>
                        <p className="text-xs text-slate-400">{o.product?.title || "Producto"}</p>
                        {o.request?.estado === "aceptada" && o.estado === "aceptada" ? (
                          <p className="text-[11px] text-green-600 mt-1">Comprador aceptó tu oferta. Se generó la orden.</p>
                        ) : o.estado === "pendiente" && o.request?.estado === "cancelada" ? (
                          <p className="text-[11px] text-slate-400 mt-1">La solicitud fue cancelada por el comprador.</p>
                        ) : null}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#8234FE]">S/ {Number(o.precio).toFixed(2)}</p>
                        <p className="text-[11px] text-slate-400">× {o.cantidad} unid.</p>
                        <p className="text-[11px] text-slate-400">Total: S/ {(Number(o.precio) * o.cantidad + Number(o.costo_envio || 0)).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                      <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(o.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      <button onClick={() => router.push(`/solicitudes/${o.request_id}`)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
                        <Eye className="w-3 h-3" /> Ver solicitud
                      </button>
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
