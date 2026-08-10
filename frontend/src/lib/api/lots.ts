import { API_URL, authFetch } from "./client";

export interface LotSale {
  id: string;
  product_id: string;
  vendedor_id: string;
  precio_lote: number;
  precio_individual: number;
  participantes_minimos: number;
  cantidad_total: number;
  cantidad_reservada: number;
  cantidad_disponible: number;
  fecha_cierre?: string;
  estado: string;
  created_at: string;
  participantes_count: number;
  product_title: string;
  product_specifications: Record<string, any>;
  product_sku?: string;
  vendedor_first_name: string;
  vendedor_last_name: string;
  vendedor_email: string;
  participants?: LotParticipant[];
  my_participant?: LotParticipant | null;
}

export interface LotParticipant {
  id: string;
  lot_sale_id: string;
  comprador_id: string;
  cantidad: number;
  estado: string;
  created_at: string;
  comprador_first_name?: string;
  comprador_last_name?: string;
}

export async function getOpenLots(): Promise<LotSale[]> {
  const res = await fetch(`${API_URL}/lots/open`);
  if (!res.ok) return [];
  return res.json();
}

export async function getLotByProduct(productId: string): Promise<LotSale | null> {
  const res = await authFetch(`${API_URL}/lots/product/${productId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getMyLots(): Promise<LotSale[]> {
  const res = await authFetch(`${API_URL}/lots/mine`);
  if (!res.ok) return [];
  return res.json();
}

export async function joinLot(lotId: string, cantidad: number): Promise<any> {
  const res = await authFetch(`${API_URL}/lots/${lotId}/join`, {
    method: "POST",
    body: JSON.stringify({ cantidad }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}

export async function getLotParticipants(lotId: string): Promise<LotParticipant[]> {
  const res = await fetch(`${API_URL}/lots/${lotId}/participants`);
  if (!res.ok) return [];
  return res.json();
}
