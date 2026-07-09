import { API_URL, authFetch } from "./client";

export async function getAuctionByProduct(productId: string): Promise<any> {
  const res = await fetch(`${API_URL}/auctions/product/${productId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function placeAuctionBid(auctionId: string, monto: number): Promise<any> {
  const res = await authFetch(`${API_URL}/auctions/${auctionId}/bid`, {
    method: "POST",
    body: JSON.stringify({ monto }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}

export async function confirmAuctionBid(bidId: string): Promise<any> {
  const res = await authFetch(`${API_URL}/auctions/bids/${bidId}/confirm`, { method: "POST" });
  if (!res.ok) throw new Error("Error al confirmar puja");
  return res.json();
}

export async function getAuctionBids(auctionId: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/auctions/${auctionId}/bids`);
  if (!res.ok) return [];
  return res.json();
}

export async function reopenAuction(auctionId: string, fechaFin: string): Promise<any> {
  const res = await authFetch(`${API_URL}/auctions/${auctionId}/reopen`, {
    method: "POST",
    body: JSON.stringify({ fecha_fin: fechaFin }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}
