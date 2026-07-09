import { API_URL, UPLOADS_URL, authFetch, getAccessToken, getRefreshToken, refreshAccessToken, removeTokens, multipartAuth } from "./client";
import { emitSessionExpired } from "../session";

export async function getCategories(): Promise<import("./common").Category[]> {
  const res = await fetch(`${API_URL}/categories`);
  if (!res.ok) throw new Error("Error al obtener categorías");
  return res.json();
}

export async function createCategory(dto: { name: string; slug: string; icon?: File; parent_id?: string }): Promise<import("./common").Category> {
  return multipartAuth(`${API_URL}/categories`, "POST", dto);
}

export async function updateCategory(id: string, dto: { name: string; slug: string; icon?: File; parent_id?: string; status?: string }): Promise<import("./common").Category> {
  return multipartAuth(`${API_URL}/categories/${id}`, "PUT", dto);
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/categories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar categoría");
}

export async function getCategoryFields(categoryId?: string): Promise<import("./common").CategoryField[]> {
  const qs = categoryId ? `?category_id=${categoryId}` : "";
  const res = await fetch(`${API_URL}/category-fields${qs}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getCategoryFieldsAdmin(): Promise<import("./common").CategoryField[]> {
  const res = await authFetch(`${API_URL}/category-fields/admin`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createCategoryField(dto: { category_id: string; name: string; label: string; type: string; required?: boolean; options?: string[] }): Promise<import("./common").CategoryField> {
  const res = await authFetch(`${API_URL}/category-fields`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function updateCategoryField(id: string, dto: Partial<import("./common").CategoryField>): Promise<import("./common").CategoryField> {
  const res = await authFetch(`${API_URL}/category-fields/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function deleteCategoryField(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/category-fields/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error");
}

export async function uploadGallery(files: FileList | File[]): Promise<string[]> {
  const fd = new FormData();
  Array.from(files).forEach(f => fd.append("files", f));
  const res = await authFetch(`${UPLOADS_URL}/uploads/gallery`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Error al subir imágenes");
  const data = await res.json();
  return data.urls;
}

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await authFetch(`${UPLOADS_URL}/uploads/image`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Error al subir imagen");
  const data = await res.json();
  return data.url;
}

export async function createProduct(dto: Partial<import("./common").Product>): Promise<import("./common").Product> {
  const res = await authFetch(`${API_URL}/products`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al crear producto");
  return res.json();
}

export async function getMyProducts(): Promise<import("./common").Product[]> {
  const res = await authFetch(`${API_URL}/products/mine`);
  if (!res.ok) throw new Error("Error al obtener productos");
  return res.json();
}

export async function bulkUploadProducts(file: File) {
  const token = getAccessToken();
  const fd = new FormData();
  fd.append("file", file);

  let res = await fetch(`${API_URL}/products/bulk`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(`${API_URL}/products/bulk`, {
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

export function getBulkTemplateUrl(): string {
  return `${API_URL}/products/template`;
}

export async function getProduct(id: string): Promise<import("./common").Product> {
  const res = await fetch(`${API_URL}/products/${id}`);
  if (!res.ok) throw new Error("Error al obtener producto");
  return res.json();
}

export async function updateProduct(id: string, dto: Partial<import("./common").Product>): Promise<import("./common").Product> {
  const res = await authFetch(`${API_URL}/products/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar producto");
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/products/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar producto");
}

export async function getActiveProducts(categoryId?: string, search?: string, limit?: number): Promise<import("./common").Product[]> {
  const params = new URLSearchParams();
  if (categoryId) params.set("category_id", categoryId);
  if (search) params.set("search", search);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_URL}/products${qs}`);
  if (!res.ok) throw new Error("Error al obtener productos");
  return res.json();
}

export async function getAdminProducts(status?: string, sort?: "ASC" | "DESC", page: number = 1, limit: number = 20): Promise<{ data: import("./common").Product[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (sort) params.set("sort", sort);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`${API_URL}/admin/products${qs}`);
  if (!res.ok) throw new Error("Error al obtener productos");
  return res.json();
}

export async function approveProduct(id: string): Promise<import("./common").Product> {
  const res = await authFetch(`${API_URL}/admin/products/${id}/approve`, { method: "PATCH" });
  if (!res.ok) throw new Error("Error al aprobar producto");
  return res.json();
}

export async function rejectProduct(id: string): Promise<import("./common").Product> {
  const res = await authFetch(`${API_URL}/admin/products/${id}/reject`, { method: "PATCH" });
  if (!res.ok) throw new Error("Error al rechazar producto");
  return res.json();
}

export async function registerProductView(id: string) {
  const res = await fetch(`${API_URL}/products/${id}/view`, { method: "POST" });
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function toggleProductSave(id: string) {
  const res = await authFetch(`${API_URL}/products/${id}/save`, { method: "POST" });
  if (!res.ok) throw new Error("Error al guardar producto");
  return res.json();
}

export async function getProductSaveStatus(id: string): Promise<{ saved: boolean }> {
  const res = await authFetch(`${API_URL}/products/${id}/save-status`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}
