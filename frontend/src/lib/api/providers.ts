import { API_URL, authFetch } from "./client";

export async function getMyProvider() {
  const res = await authFetch(`${API_URL}/providers/me`);
  if (!res.ok) return null;
  return res.json();
}

export async function setProviderZonas(zonas: string[]) {
  const res = await authFetch(`${API_URL}/providers/me/zonas`, { method: "PUT", body: JSON.stringify({ zonas }) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}

export async function setProviderDisponibilidad(disponibilidad: Record<string, any>) {
  const res = await authFetch(`${API_URL}/providers/me/disponibilidad`, { method: "PUT", body: JSON.stringify({ disponibilidad }) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}

export async function getProviderPublic(userId: string) {
  const res = await fetch(`${API_URL}/providers/public/${userId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function addServiceJob(dto: { title?: string; descripcion?: string; fotos?: string[] }) {
  const res = await authFetch(`${API_URL}/providers/me/jobs`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}

export async function deleteServiceJob(jobId: string) {
  const res = await authFetch(`${API_URL}/providers/me/jobs/${jobId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error");
  return res.json();
}
