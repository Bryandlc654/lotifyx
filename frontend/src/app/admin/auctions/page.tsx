"use client";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { adminGetAuctions, adminGetEndedAuctions, adminCloseAuction, adminGetAuctionBids } from "@/lib/api";
import {
  Eye, X, Gavel, Users, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Search,
} from "lucide-react";
import { toast } from "sonner";

interface Auction {
  id: string;
  product_title: string;
  product_sku: string;
  seller_name: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  precio_inicial: number;
  precio_actual: number;
  incremento_minimo: number;
  total_bids: number;
  confirmed_bids: number;
  highest_bid_amount: number;
  ganador_id: string | null;
  winner_name: string | null;
  winner_last_name: string | null;
  remaining_order_status: string | null;
  remaining_amount: number | null;
}

interface Bid {
  id: string;
  postor_id: string;
  monto: number;
  estado: string;
  first_name: string;
  last_name: string;
  email: string;
  order_status: string | null;
  order_total: number | null;
  created_at: string;
}

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"activas" | "cerradas">("activas");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [closingId, setClosingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const fn = tab === "activas" ? adminGetAuctions : adminGetEndedAuctions;
      setAuctions(await fn());
    } catch { toast.error("Error al cargar subastas"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [tab]);

  async function loadBids(auctionId: string) {
    setBidsLoading(true);
    setSelectedId(auctionId);
    try {
      const data = await adminGetAuctionBids(auctionId);
      setBids(data.bids || []);
    } catch { toast.error("Error al cargar pujas"); }
    finally { setBidsLoading(false); }
  }

  async function handleClose(id: string) {
    setClosingId(id);
    try {
      await adminCloseAuction(id);
      toast.success("Subasta cerrada");
      load();
    } catch { toast.error("Error al cerrar"); }
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
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-64 focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                placeholder="Buscar producto..." />
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          <button onClick={() => setTab("activas")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "activas" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Activas
          </button>
          <button onClick={() => setTab("cerradas")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "cerradas" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Cerradas
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Gavel className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay subastas {tab === "activas" ? "activas" : "cerradas"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((auction) => {
              const isActive = auction.estado === "activo";
              const expired = isActive && new Date(auction.fecha_fin) < new Date();
              return (
                <div key={auction.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isActive
                              ? expired ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                              : "bg-gray-50 text-gray-500"
                          }`}>
                            {isActive ? (expired ? "Vencida" : "Activa") : "Cerrada"}
                          </span>
                          <span className="text-xs text-gray-400">{auction.product_sku}</span>
                        </div>
                        <h3 className="font-semibold text-gray-800">{auction.product_title || "Sin título"}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Vendedor: {auction.seller_name || "-"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-700">
                          S/ {Number(auction.highest_bid_amount || auction.precio_actual || auction.precio_inicial).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {auction.confirmed_bids}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(auction.fecha_fin).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}</span>
                        </div>
                      </div>
                    </div>

                    {!isActive && auction.winner_name && (
                      <div className="mt-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-700 font-medium">Ganador: {auction.winner_name} {auction.winner_last_name}</span>
                          {auction.remaining_order_status && (
                            <span className="text-xs text-green-600">
                              Saldo: {auction.remaining_order_status === "paid" ? "Pagado" : "Pendiente"} -
                              S/ {Number(auction.remaining_amount || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      <button onClick={() => loadBids(auction.id)}
                        className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors">
                        {selectedId === auction.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        Ver pujas ({auction.total_bids})
                      </button>
                      {isActive && (
                        <button onClick={() => handleClose(auction.id)} disabled={closingId === auction.id}
                          className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                          {closingId === auction.id ? "Cerrando..." : "Cerrar subasta"}
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedId === auction.id && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      {bidsLoading ? (
                        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
                      ) : bids.length === 0 ? (
                        <p className="text-center py-6 text-sm text-gray-400">Sin pujas</p>
                      ) : (
                        <div className="p-4 space-y-2">
                          {bids.map((bid) => (
                            <div key={bid.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                                  {(bid.first_name?.[0] || "?").toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{bid.first_name} {bid.last_name}</p>
                                  <p className="text-xs text-gray-400">{bid.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-800">S/ {Number(bid.monto).toFixed(2)}</p>
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${
                                  bid.estado === "confirmada" ? "bg-green-50 text-green-600" :
                                  bid.estado === "perdida" ? "bg-red-50 text-red-500" :
                                  "bg-yellow-50 text-yellow-600"
                                }`}>
                                  {bid.estado === "confirmada" ? <CheckCircle className="w-3 h-3" /> :
                                   bid.estado === "perdida" ? <XCircle className="w-3 h-3" /> :
                                   <Clock className="w-3 h-3" />}
                                  {bid.estado}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
