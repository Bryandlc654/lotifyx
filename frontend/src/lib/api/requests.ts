import { API_URL, authFetch } from "./client";

export interface BuyerRequest {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description?: string | null;
  specifications: Record<string, any>;
  image?: string | null;
  precio_minimo?: number | null;
  precio_maximo?: number | null;
  cantidad: number;
  fecha_limite?: string | null;
  estado: string;
  created_at: string;
  updated_at: string;
  offers_count?: number;
  buyer?: { id: string; first_name?: string; last_name?: string; phone?: string } | null;
}

export interface RequestOffer {
  id: string;
  request_id: string;
  seller_id: string;
  product_id: string;
  precio: number;
  cantidad: number;
  costo_envio: number;
  mensaje?: string | null;
  estado: string;
  order_id?: string | null;
  created_at: string;
  seller?: { id: string; first_name?: string; last_name?: string; email?: string; phone?: string } | null;
  product?: { id: string; title?: string } | null;
  request?: BuyerRequest | null;
}

export interface RequestListResponse {
  items: BuyerRequest[];
  total: number;
  page: number;
  limit: number;
}

export async function getRequests(params?: { category_id?: string; q?: string; page?: number; limit?: number }): Promise<RequestListResponse> {
  const qs = new URLSearchParams();
  if (params?.category_id) qs.set("category_id", params.category_id);
  if (params?.q) qs.set("q", params.q);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const res = await fetch(`${API_URL}/requests?${qs.toString()}`);
  if (!res.ok) return { items: [], total: 0, page: 1, limit: 20 };
  return res.json();
}

export async function getRequest(id: string): Promise<BuyerRequest | null> {
  const res = await fetch(`${API_URL}/requests/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function createRequest(dto: Partial<BuyerRequest>): Promise<BuyerRequest> {
  const res = await authFetch(`${API_URL}/requests`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error al crear la solicitud" }))).message);
  return res.json();
}

export async function updateRequest(id: string, dto: Partial<BuyerRequest>): Promise<BuyerRequest> {
  const res = await authFetch(`${API_URL}/requests/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error al actualizar la solicitud" }))).message);
  return res.json();
}

export async function cancelRequest(id: string): Promise<any> {
  const res = await authFetch(`${API_URL}/requests/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error al cancelar la solicitud" }))).message);
  return res.json();
}

export async function getMyRequests(): Promise<BuyerRequest[]> {
  const res = await authFetch(`${API_URL}/requests/my/requests`);
  if (!res.ok) return [];
  return res.json();
}

export async function getMyOffers(): Promise<RequestOffer[]> {
  const res = await authFetch(`${API_URL}/requests/my/offers`);
  if (!res.ok) return [];
  return res.json();
}

export async function getRequestOffers(requestId: string): Promise<RequestOffer[]> {
  const res = await authFetch(`${API_URL}/requests/${requestId}/offers`);
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}

export async function getMyRequestOffer(requestId: string): Promise<RequestOffer[]> {
  const res = await authFetch(`${API_URL}/requests/${requestId}/my-offer`);
  if (!res.ok) return [];
  return res.json();
}

export async function makeRequestOffer(
  requestId: string,
  dto: { product_id: string; precio: number; cantidad?: number; costo_envio?: number; mensaje?: string },
): Promise<RequestOffer> {
  const res = await authFetch(`${API_URL}/requests/${requestId}/offers`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error al enviar la oferta" }))).message);
  return res.json();
}

export async function acceptRequestOffer(requestId: string, offerId: string): Promise<any> {
  const res = await authFetch(`${API_URL}/requests/${requestId}/offers/${offerId}/accept`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error al aceptar la oferta" }))).message);
  return res.json();
}
