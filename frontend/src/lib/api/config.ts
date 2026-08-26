import { API_URL, authFetch } from "./client";

export interface Umbrales {
  garantia_subasta_inversa_pct: number;
  garantia_demanda_agregada_pct: number;
  limite_pago_dias: number;
  limite_pago_normal_dias: number;
  limite_pago_subasta_dias: number;
  limite_pago_lote_garantia_dias: number;
  limite_pago_lote_saldo_dias: number;
  garantia_min_monto: number;
  garantia_tope_monto: number;
  garantia_redondeo_monto: number;
  desistimiento_penalizacion_pct: number;
  incremento_minimo_subasta: number;
  tiempo_public_subasta_horas: number;
  tiempo_public_lote_horas: number;
  tiempo_public_oferta_horas: number;
  tiempo_public_rfq_horas: number;
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

export interface GarantiaRule {
  id: string; canal: string; categoria_id: string | null; categoria_nombre?: string | null;
  pct: number | null; min_monto: number; tope_monto: number | null; redondeo: number; activo: boolean;
}

export async function getGarantiaRules(): Promise<{ rules: GarantiaRule[]; categorias: { id: string; name: string }[] }> {
  const res = await authFetch(`${API_URL}/admin/config/garantias`);
  if (!res.ok) throw new Error("Error al obtener reglas de garantía");
  return res.json();
}

export async function saveGarantiaRule(dto: Partial<GarantiaRule>): Promise<{ message: string }> {
  const res = await authFetch(`${API_URL}/admin/config/garantias/regla`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error al guardar regla" }))).message);
  return res.json();
}

export async function deleteGarantiaRule(id: string): Promise<{ message: string }> {
  const res = await authFetch(`${API_URL}/admin/config/garantias/regla/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar regla");
  return res.json();
}
