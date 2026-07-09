import { API_URL, authFetch, getAccessToken, getRefreshToken, refreshAccessToken, removeTokens } from "./client";
import { emitSessionExpired } from "../session";

export async function getMyOrders() {
  const res = await authFetch(`${API_URL}/checkout/orders`);
  if (!res.ok) throw new Error("Error al obtener pedidos");
  return res.json();
}

export async function getMySales() {
  const res = await authFetch(`${API_URL}/checkout/sales`);
  if (!res.ok) throw new Error("Error al obtener ventas");
  return res.json();
}

export async function getDashboard() {
  const res = await authFetch(`${API_URL}/checkout/dashboard`);
  if (!res.ok) throw new Error("Error al cargar dashboard");
  return res.json();
}

export async function submitClaim(data: { order_id: string; reason: string; description: string; solution: string; amount?: number }) {
  const res = await authFetch(`${API_URL}/checkout/claims`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}

export async function submitCheckout(data: {
  items: { id: string; price: number }[];
  origin_account_id: string;
  operation_number: string;
  amount: number;
  proof: File;
  bid_id?: string;
}) {
  const token = getAccessToken();
  const fd = new FormData();
  if (data.items.length > 0) fd.append("items", JSON.stringify(data.items));
  fd.append("origin_account_id", data.origin_account_id);
  fd.append("operation_number", data.operation_number);
  fd.append("amount", String(data.amount));
  fd.append("proof", data.proof);
  if (data.bid_id) fd.append("bid_id", data.bid_id);

  let res = await fetch(`${API_URL}/checkout/submit`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(`${API_URL}/checkout/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${newToken}` },
        body: fd,
      });
    } else {
      removeTokens();
      emitSessionExpired();
    }
  }

  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}
