import { API_URL, authFetch } from "./client";

export interface RcgTier {
  id?: string;
  lot_sale_id?: string;
  desde: number;
  hasta: number | null;
  tipo_beneficio: string;
  valor: number;
  activacion: string;
  descripcion?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LotBenefitApplication {
  id: string;
  lot_sale_id: string;
  tier_id?: string | null;
  comprador_id?: string | null;
  lot_participant_id?: string | null;
  order_id?: string | null;
  beneficio_aplicado: string;
  monto: number;
  unidades_extra: number;
  estado: string;
  applied_at: string;
  tipo_beneficio?: string;
  desde?: number;
  hasta?: number | null;
  activacion?: string;
  tier_valor?: number;
  comprador_first_name?: string;
  comprador_last_name?: string;
}

export interface LotSale {
  id: string;
  product_id: string;
  vendedor_id: string;
  precio_lote: number;
  precio_individual: number;
  participantes_minimos: number;
  cmc: number;
  cantidad_total: number;
  cantidad_reservada: number;
  cantidad_disponible: number;
  meta_venta: number;
  destacado: boolean;
  divisible: boolean;
  rcg_tiers: RcgTier[];
  tier_actual?: RcgTier | null;
  expectativa_superada: boolean;
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
  order_id?: string | null;
  garantia_pagada?: boolean;
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

export async function getLotPricing(lotId: string): Promise<RcgTier[]> {
  const res = await fetch(`${API_URL}/lots/${lotId}/pricing`);
  if (!res.ok) return [];
  return res.json();
}

export async function saveLotPricing(lotId: string, tiers: RcgTier[], meta_venta?: number | null): Promise<RcgTier[]> {
  const res = await authFetch(`${API_URL}/lots/${lotId}/pricing`, {
    method: "PUT",
    body: JSON.stringify({ tiers, meta_venta }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}
