import { API_URL, authFetch } from "./client";

export async function getProductReviews(productId: string): Promise<import("./common").Review[]> {
  const res = await fetch(`${API_URL}/reviews/product/${productId}`);
  if (!res.ok) throw new Error("Error al obtener reseñas");
  return res.json();
}

export async function createReview(dto: { product_id: string; order_id: string; rating: number; comment?: string; images?: string[] }): Promise<import("./common").Review> {
  const res = await authFetch(`${API_URL}/reviews`, {
    method: "POST", body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}

export async function getMyReviews(): Promise<import("./common").Review[]> {
  const res = await authFetch(`${API_URL}/reviews/mine`);
  if (!res.ok) throw new Error("Error al obtener reseñas");
  return res.json();
}

export async function getOrderReviews(orderId: string): Promise<import("./common").Review[]> {
  const res = await authFetch(`${API_URL}/reviews/order/${orderId}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getSellerReviews(): Promise<import("./common").Review[]> {
  const res = await authFetch(`${API_URL}/reviews/seller`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}
