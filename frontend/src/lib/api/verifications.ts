import { API_URL, UPLOADS_URL, authFetch } from "./client";
import type { ProductVerification } from "./common";

export interface VerificationPayload {
  fotografias: string[];
  video?: string;
  numero_serie?: string;
  documentos: string[];
  capacidad_produccion?: { unidades_mes: number; plazo?: string };
  declaracion_ficha: boolean;
  // VI. Inmobiliario: expediente legal + ubicación geográfica
  partida_registral_doc?: string;
  hr_pu_doc?: string;
  arbitrios_doc?: string;
  cargas_gravamenes_doc?: string;
  poderes_doc?: string;
  permisos_docs?: string[];
  contrato_docs?: string[];
  titular_anunciante?: string;
  declaracion_cargas?: boolean;
  latitud?: number;
  longitud?: number;
  direccion?: string;
}

export async function uploadVideo(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await authFetch(`${UPLOADS_URL}/uploads/video`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Error al subir video");
  const data = await res.json();
  return data.url;
}

export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await authFetch(`${UPLOADS_URL}/uploads/file`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Error al subir archivo");
  const data = await res.json();
  return data.url;
}

export async function submitVerification(productId: string, payload: VerificationPayload): Promise<ProductVerification> {
  const res = await authFetch(`${API_URL}/products/${productId}/verification`, { method: "POST", body: JSON.stringify({ payload }) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error al enviar verificación" }))).message);
  return res.json();
}

export async function getVerification(productId: string): Promise<{ product: any; verification: ProductVerification | null }> {
  const res = await authFetch(`${API_URL}/products/${productId}/verification`);
  if (!res.ok) throw new Error("Error al obtener verificación");
  return res.json();
}

export interface AdminVerification extends ProductVerification {
  title: string;
  sku: string;
  metodo_pago: string;
  specifications: Record<string, any>;
  product_estado: string;
  ubicacion: string;
  verification_status: string;
  verification_required: boolean;
  seller_email: string;
  category_name: string;
}

export async function getAdminVerifications(estado?: string): Promise<AdminVerification[]> {
  const qs = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  const res = await authFetch(`${API_URL}/admin/verifications${qs}`);
  if (!res.ok) throw new Error("Error al obtener verificaciones");
  return res.json();
}

export async function approveVerification(id: string, observaciones?: string): Promise<any> {
  const res = await authFetch(`${API_URL}/admin/verifications/${id}/approve`, { method: "POST", body: JSON.stringify({ observaciones }) });
  if (!res.ok) throw new Error("Error al aprobar verificación");
  return res.json();
}

export async function rejectVerification(id: string, observaciones: string): Promise<any> {
  const res = await authFetch(`${API_URL}/admin/verifications/${id}/reject`, { method: "POST", body: JSON.stringify({ observaciones }) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error al rechazar verificación" }))).message);
  return res.json();
}
