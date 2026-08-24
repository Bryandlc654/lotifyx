import { API_URL, authFetch } from "./client";

export interface Umbrales {
  garantia_subasta_inversa_pct: number;
  garantia_demanda_agregada_pct: number;
  limite_pago_dias: number;
  limite_pago_normal_dias: number;
  limite_pago_subasta_dias: number;
  limite_pago_lote_garantia_dias: number;
  limite_pago_lote_saldo_dias: number;
  max_incumplimientos: number;
  sancion_dias: number;
  garantia_oferta_pct: number;
  max_ofertas_pendientes: number;
  max_pujas_pendientes: number;
  reconexion_dias: number;
  session_timeout_minutos: number;
  max_login_intentos: number;
  bloqueo_login_minutos: number;
}

export async function getUmbrales(): Promise<Umbrales | null> {
  const res = await authFetch(`${API_URL}/admin/config/umbrales`);
  if (!res.ok) return null;
  return res.json();
}

export async function saveUmbrales(dto: Partial<Umbrales>): Promise<Umbrales> {
  const res = await authFetch(`${API_URL}/admin/config/umbrales`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error al guardar umbrales" }))).message);
  return res.json();
}
