import { API_URL, authFetch } from "./client";

export interface Umbrales {
  garantia_subasta_inversa_pct: number;
  garantia_demanda_agregada_pct: number;
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
