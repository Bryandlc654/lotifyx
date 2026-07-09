"use client";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { adminGetAuctions, adminGetEndedAuctions, adminCloseAuction, adminGetAuctionBids } from "@/lib/api";
import { Eye, X, Gavel, Users, Search, Trophy, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Auction {
  id: string; product_title: string; product_sku: string; seller_name: string;
  estado: string; fecha_inicio: string; fecha_fin: string;
  precio_inicial: number; precio_actual: number; incremento_minimo: number;
  total_bids: number; confirmed_bids: number; highest_bid_amount: number;
  ganador_id: string | null; winner_name: string | null; winner_last_name: string | null;
  remaining_order_status: string | null; remaining_amount: number | null;
}

interface Bid {
  id: string; postor_id: string; monto: number; estado: string;
  first_name: string; last_name: string; email: string;
  order_status: string | null; created_at: string;
}

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"activas" | "cerradas">("activas");
  const [search, setSearch] = useState("");
  const [closingId, setClosingId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: "participants" | "winner"; auction: Auction; bids: Bid[]; loading: boolean } | null>(null);

  async function load() {
    setLoading(true);
    try { setAuctions(await (tab === "activas" ? adminGetAuctions : adminGetEndedAuctions)()); }
    catch { toast.error("Error al cargar subastas"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [tab]);

  async function openParticipants(auction: Auction) {
    setModal({ type: "participants", auction, bids: [], loading: true });
    try {
      const data = await adminGetAuctionBids(auction.id);
      setModal({ type: "participants", auction, bids: data.bids || [], loading: false });
    } catch { toast.error("Error al cargar"); setModal(null); }
  }

  function openWinner(auction: Auction) {
    setModal({ type: "winner", auction, bids: [], loading: false });
  }

  async function handleClose(id: string) {
    setClosingId(id);
    try { await adminCloseAuction(id); toast.success("Subasta cerrada"); load(); }
    catch { toast.error("Error al cerrar"); }
    finally { setClosingId(null); }
  }

  const filtered = auctions.filter((a) =>
    !search || a.product_title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Subastas</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-64 focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
              placeholder="Buscar producto..." />
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {(["activas", "cerradas"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t === "activas" ? "Activas" : "Cerradas"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Gavel className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay subastas {tab === "activas" ? "activas" : "cerradas"}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Producto</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Precio actual</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Pujas</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cierre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Ganador</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((a) => {
                  const isActive = a.estado === "activo";
                  const expired = isActive && new Date(a.fecha_fin) < new Date();
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{a.product_title || "—"}</p>
                        <p className="text-xs text-gray-400">{a.seller_name ? `Vend: ${a.seller_name}` : ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isActive ? (expired ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600") : "bg-gray-50 text-gray-500"
                        }`}>
                          {isActive ? (expired ? "Vencida" : "Activa") : "Cerrada"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        S/ {Number(a.highest_bid_amount || a.precio_actual || a.precio_inicial).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium">{a.confirmed_bids}</span>
                        <span className="text-gray-400 text-xs ml-1">/ {a.total_bids}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(a.fecha_fin).toLocaleDateString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        {a.winner_name ? (
                          <span className="text-green-700 font-medium text-xs">{a.winner_name} {a.winner_last_name}</span>
                        ) : isActive ? (
                          <span className="text-gray-400 text-xs">—</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin ganador</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openParticipants(a)}
                            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                            title="Ver participantes">
                            <Users className="w-3.5 h-3.5" /> Participantes
                          </button>
                          {!isActive && a.winner_name && (
                            <button onClick={() => openWinner(a)}
                              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                              title="Ver ganador">
                              <Trophy className="w-3.5 h-3.5" /> Ganador
                            </button>
                          )}
                          {isActive && (
                            <button onClick={() => handleClose(a.id)} disabled={closingId === a.id}
                              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                              {closingId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Cerrar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal participantes */}
      {modal?.type === "participants" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Participantes — {modal.auction.product_title}</h2>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            {modal.loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
            ) : modal.bids.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">Sin pujas registradas</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 font-semibold text-gray-500">Postor</th>
                    <th className="text-right py-2 font-semibold text-gray-500">Monto</th>
                    <th className="text-center py-2 font-semibold text-gray-500">Estado</th>
                    <th className="text-right py-2 font-semibold text-gray-500">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {modal.bids.map((b) => (
                    <tr key={b.id}>
                      <td className="py-2">
                        <p className="font-medium text-gray-800">{b.first_name} {b.last_name}</p>
                        <p className="text-xs text-gray-400">{b.email}</p>
                      </td>
                      <td className="py-2 text-right font-semibold">S/ {Number(b.monto).toFixed(2)}</td>
                      <td className="py-2 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${
                          b.estado === "confirmada" ? "bg-green-50 text-green-600" :
                          b.estado === "perdida" ? "bg-red-50 text-red-500" : "bg-yellow-50 text-yellow-600"
                        }`}>
                          {b.estado === "confirmada" ? <CheckCircle className="w-3 h-3" /> :
                           b.estado === "perdida" ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {b.estado}
                        </span>
                      </td>
                      <td className="py-2 text-right text-xs text-gray-400">{new Date(b.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", hour: "2-digit" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal ganador */}
      {modal?.type === "winner" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Ganador de la subasta</h2>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 text-center">
              <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="text-2xl font-bold text-gray-800">{modal.auction.winner_name} {modal.auction.winner_last_name}</p>
              <p className="text-lg font-semibold text-purple-700 mt-2">S/ {Number(modal.auction.highest_bid_amount).toFixed(2)}</p>
              {modal.auction.remaining_order_status && (
                <div className="mt-3 bg-white rounded-lg px-4 py-2 text-sm">
                  <span className="text-gray-500">Saldo pendiente: </span>
                  <span className={modal.auction.remaining_order_status === "paid" ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"}>
                    {modal.auction.remaining_order_status === "paid" ? "Pagado" : "Pendiente"} — S/ {Number(modal.auction.remaining_amount || 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
