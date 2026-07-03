import { emitSessionExpired } from "./session";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api";
const UPLOADS_URL = API_URL.replace(/\/api$/, "");

export function getImageUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${UPLOADS_URL}${path}`;
}

// ─── Token helpers ───────────────────────────────────────────

const ACCESS_KEY = "lotifyx_access";
const REFRESH_KEY = "lotifyx_refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  const stored = localStorage.getItem(REFRESH_KEY);
  if (stored) return stored;
  return getAccessToken(); // fallback
}

export function setTokens(access: string, refresh?: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function removeTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function getCurrentUserId(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

// ─── Auto-refresh ────────────────────────────────────────────

async function refreshAccessToken(): Promise<string | null> {
  try {
    const storedRefresh = getRefreshToken();
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: storedRefresh ? { "Content-Type": "application/json" } : {},
      body: storedRefresh ? JSON.stringify({ refreshToken: storedRefresh }) : undefined,
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.accessToken) setTokens(data.accessToken, data.refreshToken);
    return data.accessToken || null;
  } catch {
    return null;
  }
}

// ─── Authenticated fetch ─────────────────────────────────────

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  let res = await fetch(url, { ...options, headers, credentials: "include" });

  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    } else {
      removeTokens();
      emitSessionExpired();
    }
  }

  return res;
}

// ─── Types ────────────────────────────────────────────────────

interface RegisterPayload {
  nombre: string;
  apellidos: string;
  dni: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  contrasena: string;
  ruc?: string;
  razonSocial?: string;
  codigoReferidos?: string;
  comoNosEncontraste: string;
  aceptaTerminos: boolean;
}

interface LoginPayload {
  credential: string;
  contrasena: string;
}

interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken?: string;
  user: Record<string, unknown>;
}

// ─── API calls ────────────────────────────────────────────────

export async function registerUser(payload: RegisterPayload) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data.message || "Error al registrarse";
    throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
  }

  if (data.accessToken && data.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
  } else if (data.token) {
    setTokens(data.token, "");
  }

  return data;
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data.message || "Error al iniciar sesión";
    throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
  }

  if (data.accessToken && data.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
  } else if (data.token) {
    setTokens(data.token, "");
  }

  return data;
}

export async function getProfile() {
  const res = await authFetch(`${API_URL}/auth/me`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al obtener perfil");
  }

  return data;
}

export async function updateProfile(dto: any) {
  const res = await authFetch(`${API_URL}/auth/me`, { method: "PUT", body: JSON.stringify(dto) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error al actualizar perfil");
  return data;
}

export async function verifyEmail(email: string, code: string) {
  const res = await fetch(`${API_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data.message || "Error al verificar";
    throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
  }

  if (data.accessToken && data.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
  } else if (data.token) {
    setTokens(data.token, "");
  }

  return data;
}

export async function logoutUser() {
  const storedRefresh = getRefreshToken();
  await authFetch(`${API_URL}/auth/logout`, {
    method: "POST",
    body: storedRefresh ? JSON.stringify({ refreshToken: storedRefresh }) : undefined,
  }).catch(() => {});
  removeTokens();
}

// ─── Google OAuth ─────────────────────────────────────────────

export function getGoogleAuthUrl(): string {
  return `${API_URL}/auth/google`;
}

export function handleGoogleCallback(
  accessToken: string,
  refreshToken: string
) {
  setTokens(accessToken, refreshToken);
}

// ─── Banners ──────────────────────────────────────────────────

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export async function getBanners(): Promise<Banner[]> {
  const res = await fetch(`${API_URL}/banners`);
  if (!res.ok) throw new Error("Error al obtener banners");
  return res.json();
}

export async function createBanner(title: string, file: File): Promise<Banner> {
  return multipartAuth(`${API_URL}/banners`, "POST", { title, image: file });
}

export async function updateBanner(id: string, title: string, file?: File): Promise<Banner> {
  return multipartAuth(`${API_URL}/banners/${id}`, "PUT", { title, ...(file ? { image: file } : {}) });
}

export async function deleteBanner(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/banners/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar banner");
}

// ─── Marquees ─────────────────────────────────────────────────

export interface Marquee {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export async function getMarquees(): Promise<Marquee[]> {
  const res = await fetch(`${API_URL}/marquees`);
  if (!res.ok) throw new Error("Error al obtener logos");
  return res.json();
}

export async function createMarquee(name: string, file: File): Promise<Marquee> {
  return multipartAuth(`${API_URL}/marquees`, "POST", { name, image: file });
}

export async function updateMarquee(id: string, name: string, file?: File): Promise<Marquee> {
  return multipartAuth(`${API_URL}/marquees/${id}`, "PUT", { name, ...(file ? { image: file } : {}) });
}

export async function deleteMarquee(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/marquees/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar logo");
}

// ─── Settings ─────────────────────────────────────────────────

export async function getSettings(): Promise<Record<string, string>> {
  const res = await authFetch(`${API_URL}/settings`);
  if (!res.ok) throw new Error("Error al obtener configuración");
  return res.json();
}

export async function updateSettings(data: Record<string, string>): Promise<void> {
  const res = await authFetch(`${API_URL}/settings`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar configuración");
}

// ─── Testimonials ────────────────────────────────────────────

export interface Testimonial {
  id: string;
  stars: number;
  text: string;
  name: string;
  cargo: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const res = await fetch(`${API_URL}/testimonials`);
  if (!res.ok) throw new Error("Error al obtener testimonios");
  return res.json();
}

export async function createTestimonial(dto: { stars: number; text: string; name: string; cargo: string }): Promise<Testimonial> {
  const res = await authFetch(`${API_URL}/testimonials`, {
    method: "POST", body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Error al crear testimonio");
  return res.json();
}

export async function updateTestimonial(id: string, dto: Partial<{ stars: number; text: string; name: string; cargo: string; is_active: boolean }>): Promise<Testimonial> {
  const res = await authFetch(`${API_URL}/testimonials/${id}`, {
    method: "PUT", body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Error al actualizar testimonio");
  return res.json();
}

export async function deleteTestimonial(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/testimonials/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar testimonio");
}

export async function reorderTestimonials(ids: string[]): Promise<void> {
  const res = await authFetch(`${API_URL}/testimonials/reorder`, {
    method: "PUT", body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Error al reordenar testimonios");
}

// ─── Admin Users ─────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  phone: string;
  status: string;
  is_verified: boolean;
  provider: string;
  referral_code: string;
  role_id: string;
  role?: { id: string; name: string };
  profile?: {
    first_name: string; last_name: string; document_type: string;
    document_number: string; ruc: string; razon_social: string;
    avatar_url: string;
  };
  created_at: string;
}

export async function getAdminUsers(params?: {
  search?: string; role?: string; status?: string; is_admin?: string; page?: number; limit?: number;
}): Promise<{ data: AdminUser[]; total: number; page: number; totalPages: number }> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.role) qs.set("role", params.role);
  if (params?.status) qs.set("status", params.status);
  if (params?.is_admin) qs.set("is_admin", params.is_admin);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const res = await authFetch(`${API_URL}/admin/users?${qs.toString()}`);
  if (!res.ok) throw new Error("Error al obtener usuarios");
  return res.json();
}

export async function getAdminUser(id: string): Promise<AdminUser> {
  const res = await authFetch(`${API_URL}/admin/users/${id}`);
  if (!res.ok) throw new Error("Usuario no encontrado");
  return res.json();
}

export async function createAdminUser(dto: any): Promise<AdminUser> {
  const res = await authFetch(`${API_URL}/admin/users`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error((await res.json().catch(()=>({message:"Error"}))).message);
  return res.json();
}

export async function updateAdminUser(id: string, dto: any): Promise<AdminUser> {
  const res = await authFetch(`${API_URL}/admin/users/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error((await res.json().catch(()=>({message:"Error"}))).message);
  return res.json();
}

export async function deleteAdminUser(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar usuario");
}

export async function toggleUserActive(id: string): Promise<any> {
  const res = await authFetch(`${API_URL}/admin/users/${id}/toggle-active`, { method: "PATCH" });
  if (!res.ok) throw new Error("Error al cambiar estado");
  return res.json();
}

export async function getAdminRoles(): Promise<{ id: string; name: string }[]> {
  const res = await authFetch(`${API_URL}/admin/users/roles`);
  if (!res.ok) throw new Error("Error al obtener roles");
  return res.json();
}

// ─── Categories ──────────────────────────────────────────────

export interface Category {
  id: string; name: string; slug: string; icon: string;
  parent_id: string; parent?: Category; children?: Category[];
  status: string; created_at: string;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/categories`);
  if (!res.ok) throw new Error("Error al obtener categorías");
  return res.json();
}

export async function createCategory(dto: { name: string; slug: string; icon?: File; parent_id?: string }): Promise<Category> {
  return multipartAuth(`${API_URL}/categories`, "POST", dto);
}

export async function updateCategory(id: string, dto: { name: string; slug: string; icon?: File; parent_id?: string; status?: string }): Promise<Category> {
  return multipartAuth(`${API_URL}/categories/${id}`, "PUT", dto);
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/categories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar categoría");
}

// ─── Category Fields ─────────────────────────────────────────

export interface CategoryField {
  id: string; category_id: string; name: string; label: string; type: string;
  required: boolean; options: string[] | null; order_index: number;
}
export async function getCategoryFields(categoryId?: string): Promise<CategoryField[]> {
  const qs = categoryId ? `?category_id=${categoryId}` : "";
  const res = await fetch(`${API_URL}/category-fields${qs}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}
export async function getCategoryFieldsAdmin(): Promise<CategoryField[]> {
  const res = await authFetch(`${API_URL}/category-fields/admin`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}
export async function createCategoryField(dto: { category_id: string; name: string; label: string; type: string; required?: boolean; options?: string[] }): Promise<CategoryField> {
  const res = await authFetch(`${API_URL}/category-fields`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error");
  return res.json();
}
export async function updateCategoryField(id: string, dto: Partial<CategoryField>): Promise<CategoryField> {
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

// ─── Products ────────────────────────────────────────────────

export interface Product {
  id: string;
  sku?: string;
  user_id: string;
  category_id: string;
  title: string;
  specifications: Record<string, any>;
  stock?: number;
  views?: number;
  saves_count?: number;
  metodo_pago: string;
  envio_delivery: boolean;
  envio_courier: boolean;
  costo_envio: number;
  tiempo_entrega: string;
  cambios: string;
  devoluciones: string;
  garantia: string;
  politicas_imagenes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  author?: string;
  status: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export async function createProduct(dto: Partial<Product>): Promise<Product> {
  const res = await authFetch(`${API_URL}/products`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al crear producto");
  return res.json();
}

export async function getMyProducts(): Promise<Product[]> {
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

export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`);
  if (!res.ok) throw new Error("Error al obtener producto");
  return res.json();
}

export async function updateProduct(id: string, dto: Partial<Product>): Promise<Product> {
  const res = await authFetch(`${API_URL}/products/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar producto");
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/products/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar producto");
}

export async function getActiveProducts(categoryId?: string, search?: string, limit?: number): Promise<Product[]> {
  const params = new URLSearchParams();
  if (categoryId) params.set("category_id", categoryId);
  if (search) params.set("search", search);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_URL}/products${qs}`);
  if (!res.ok) throw new Error("Error al obtener productos");
  return res.json();
}

export async function getAdminProducts(status?: string, sort?: "ASC" | "DESC", page: number = 1, limit: number = 20): Promise<{ data: Product[]; total: number; page: number; totalPages: number }> {
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

export async function approveProduct(id: string): Promise<Product> {
  const res = await authFetch(`${API_URL}/admin/products/${id}/approve`, { method: "PATCH" });
  if (!res.ok) throw new Error("Error al aprobar producto");
  return res.json();
}

export async function rejectProduct(id: string): Promise<Product> {
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

// ─── Secondary Banners ───────────────────────────────────────

export interface SecondaryBanner {
  id: string; title: string; subtitle: string; image_url: string; link_url: string;
  button_text: string; type: string; is_active: boolean; order_index: number; created_at: string;
}

export async function getSecondaryBanners(type?: string): Promise<SecondaryBanner[]> {
  const qs = type ? `?type=${type}` : "";
  const res = await fetch(`${API_URL}/secondary-banners${qs}`);
  if (!res.ok) throw new Error("Error al obtener banners");
  return res.json();
}

export async function createSecondaryBanner(dto: { title: string; subtitle?: string; type: string; link_url?: string; button_text?: string }, file: File): Promise<SecondaryBanner> {
  return multipartAuth(`${API_URL}/secondary-banners`, "POST", { ...dto, image: file });
}

export async function updateSecondaryBanner(id: string, dto: { title?: string; subtitle?: string; link_url?: string; button_text?: string; is_active?: boolean; type?: string }, file?: File): Promise<SecondaryBanner> {
  return multipartAuth(`${API_URL}/secondary-banners/${id}`, "PUT", { ...dto, ...(file ? { image: file } : {}) });
}

export async function deleteSecondaryBanner(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/secondary-banners/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar banner");
}

// ─── Backing Logos ───────────────────────────────────────────

export interface BackingLogo {
  id: string; name: string; image_url: string; is_active: boolean; order_index: number; created_at: string;
}

export async function getBackingLogos(): Promise<BackingLogo[]> {
  const res = await fetch(`${API_URL}/backing`);
  if (!res.ok) throw new Error("Error al obtener logos");
  return res.json();
}

export async function createBackingLogo(name: string, file: File): Promise<BackingLogo> {
  return multipartAuth(`${API_URL}/backing`, "POST", { name, image: file });
}

export async function updateBackingLogo(id: string, dto: { name?: string; is_active?: boolean }, file?: File): Promise<BackingLogo> {
  return multipartAuth(`${API_URL}/backing/${id}`, "PUT", { ...dto, ...(file ? { image: file } : {}) });
}

export async function deleteBackingLogo(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/backing/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar logo");
}

// ─── Plans ───────────────────────────────────────────────────

export interface Plan {
  id: string; name: string; description: string; price: number;
  max_products: number; max_featured: number; duration_days: number;
  commission: number;
  icon: string; is_active: boolean; order_index: number;
}

export async function getPlans(): Promise<Plan[]> {
  const res = await fetch(`${API_URL}/plans`);
  if (!res.ok) throw new Error("Error al obtener planes");
  return res.json();
}

export async function createPlan(dto: { name: string; description?: string; price: number; max_products: number; max_featured?: number; duration_days?: number; commission?: number }): Promise<Plan> {
  const res = await authFetch(`${API_URL}/plans`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error((await res.json().catch(()=>({message:"Error"}))).message);
  return res.json();
}

export async function updatePlan(id: string, dto: Partial<Plan>): Promise<Plan> {
  const res = await authFetch(`${API_URL}/plans/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar plan");
  return res.json();
}

export async function deletePlan(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/plans/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar plan");
}

// ─── FAQs ────────────────────────────────────────────────────

export interface Faq { id: string; category: string; question: string; answer: string; is_active: boolean; order_index: number; }
export async function getFaqs(category?: string): Promise<Faq[]> { const qs = category ? `?category=${encodeURIComponent(category)}` : ""; const res = await fetch(`${API_URL}/faqs${qs}`); if (!res.ok) throw new Error("Error"); return res.json(); }
export async function getFaqsAdmin(): Promise<Faq[]> { const res = await authFetch(`${API_URL}/faqs/admin`); if (!res.ok) throw new Error("Error"); return res.json(); }
export async function createFaq(dto: { category: string; question: string; answer: string }): Promise<Faq> { const res = await authFetch(`${API_URL}/faqs`, { method: "POST", body: JSON.stringify(dto) }); if (!res.ok) throw new Error("Error"); return res.json(); }
export async function updateFaq(id: string, dto: Partial<Faq>): Promise<Faq> { const res = await authFetch(`${API_URL}/faqs/${id}`, { method: "PUT", body: JSON.stringify(dto) }); if (!res.ok) throw new Error("Error"); return res.json(); }
export async function deleteFaq(id: string): Promise<void> { const res = await authFetch(`${API_URL}/faqs/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Error"); }

// ─── FAQ Categories ──────────────────────────────────────────

export interface FaqCategory { id: string; name: string; slug: string; description: string; order_index: number; is_active: boolean; }
export async function getFaqCategories(): Promise<FaqCategory[]> { const res = await fetch(`${API_URL}/faq-categories`); if (!res.ok) throw new Error("Error"); return res.json(); }
export async function getFaqCategoriesAdmin(): Promise<FaqCategory[]> { const res = await authFetch(`${API_URL}/faq-categories/admin`); if (!res.ok) throw new Error("Error"); return res.json(); }
export async function createFaqCategory(dto: { name: string; slug?: string; description?: string }): Promise<FaqCategory> { const res = await authFetch(`${API_URL}/faq-categories`, { method: "POST", body: JSON.stringify(dto) }); if (!res.ok) throw new Error("Error"); return res.json(); }
export async function updateFaqCategory(id: string, dto: Partial<FaqCategory>): Promise<FaqCategory> { const res = await authFetch(`${API_URL}/faq-categories/${id}`, { method: "PUT", body: JSON.stringify(dto) }); if (!res.ok) throw new Error("Error"); return res.json(); }
export async function deleteFaqCategory(id: string): Promise<void> { const res = await authFetch(`${API_URL}/faq-categories/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Error"); }

// ─── RBAC ────────────────────────────────────────────────────

export interface RoleWithPerms {
  id: string; name: string; description: string;
  rolePermissions: { id: string; permission_id: string; permission?: Permission; }[];
}

export interface Permission {
  id: string; name: string; description: string; module: string;
}

export async function getRbacRoles(): Promise<RoleWithPerms[]> {
  const res = await authFetch(`${API_URL}/admin/rbac/roles`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createRbacRole(dto: { name: string; description?: string }): Promise<any> {
  const res = await authFetch(`${API_URL}/admin/rbac/roles`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
}

export async function deleteRbacRole(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/rbac/roles/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json()).message);
}

export async function getPermissions(): Promise<Permission[]> {
  const res = await authFetch(`${API_URL}/admin/rbac/permissions`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function assignPermission(roleId: string, permissionId: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/rbac/roles/${roleId}/permissions`, {
    method: "POST", body: JSON.stringify({ permission_id: permissionId }),
  });
  if (!res.ok) throw new Error("Error");
}

export async function revokePermission(rpId: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/rbac/permissions/${rpId}/revoke`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error");
}

export async function seedPermissions(): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/rbac/seed`, { method: "POST" });
  if (!res.ok) throw new Error("Error");
}

// ─── Leads ────────────────────────────────────────────────────

export interface Lead {
  id: string; first_name: string; last_name: string; email: string; phone: string; message: string; created_at: string;
}

export async function getLeads(): Promise<Lead[]> {
  const res = await authFetch(`${API_URL}/leads`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createLead(dto: { first_name: string; last_name: string; email: string; phone?: string; message: string }): Promise<Lead> {
  const res = await fetch(`${API_URL}/leads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function deleteLead(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/leads/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error");
}

// ─── Newsletter ───────────────────────────────────────────────

export async function getAdminNewsletter(): Promise<any[]> {
  const res = await authFetch(`${API_URL}/admin/newsletter`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

// ─── Tutorials ────────────────────────────────────────────────

export interface Tutorial {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  image_url?: string;
  status: string;
  created_at: string;
}

export async function getTutorials(): Promise<Tutorial[]> {
  const res = await fetch(`${API_URL}/tutorials`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminTutorials(): Promise<Tutorial[]> {
  const res = await authFetch(`${API_URL}/admin/tutorials`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminTutorial(id: string): Promise<Tutorial> {
  const res = await authFetch(`${API_URL}/admin/tutorials/${id}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createTutorial(dto: Partial<Tutorial>): Promise<Tutorial> {
  const res = await authFetch(`${API_URL}/admin/tutorials`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al crear tutorial");
  return res.json();
}

export async function updateTutorial(id: string, dto: Partial<Tutorial>): Promise<Tutorial> {
  const res = await authFetch(`${API_URL}/admin/tutorials/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar tutorial");
  return res.json();
}

export async function deleteTutorial(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/tutorials/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar tutorial");
}

// ─── Events ───────────────────────────────────────────────────

export interface AppEvent {
  id: string;
  title: string;
  description?: string;
  event_date?: string;
  location?: string;
  image_url?: string;
  status: string;
  created_at: string;
}

export async function getEvents(): Promise<AppEvent[]> {
  const res = await fetch(`${API_URL}/events`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminEvents(): Promise<AppEvent[]> {
  const res = await authFetch(`${API_URL}/admin/events`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminEvent(id: string): Promise<AppEvent> {
  const res = await authFetch(`${API_URL}/admin/events/${id}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createEvent(dto: Partial<AppEvent>): Promise<AppEvent> {
  const res = await authFetch(`${API_URL}/admin/events`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al crear evento");
  return res.json();
}

export async function updateEvent(id: string, dto: Partial<AppEvent>): Promise<AppEvent> {
  const res = await authFetch(`${API_URL}/admin/events/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar evento");
  return res.json();
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/events/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar evento");
}

// ─── Help Articles ────────────────────────────────────────────

export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  status: string;
  created_at: string;
}

export async function getHelpArticles(): Promise<HelpArticle[]> {
  const res = await fetch(`${API_URL}/help`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminHelpArticles(): Promise<HelpArticle[]> {
  const res = await authFetch(`${API_URL}/admin/help`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminHelpArticle(id: string): Promise<HelpArticle> {
  const res = await authFetch(`${API_URL}/admin/help/${id}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createHelpArticle(dto: Partial<HelpArticle>): Promise<HelpArticle> {
  const res = await authFetch(`${API_URL}/admin/help`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al crear artículo");
  return res.json();
}

export async function updateHelpArticle(id: string, dto: Partial<HelpArticle>): Promise<HelpArticle> {
  const res = await authFetch(`${API_URL}/admin/help/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar artículo");
  return res.json();
}

export async function deleteHelpArticle(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/help/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar artículo");
}

// ─── Press ───────────────────────────────────────────────────

export interface PressArticle {
  id: string;
  title: string;
  excerpt?: string;
  source: string;
  link: string;
  image_url?: string;
  status: string;
  published_at?: string;
  created_at: string;
}

export async function getPressArticles(): Promise<PressArticle[]> {
  const res = await fetch(`${API_URL}/press`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminPressArticles(): Promise<PressArticle[]> {
  const res = await authFetch(`${API_URL}/admin/press`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createPressArticle(dto: Partial<PressArticle>): Promise<PressArticle> {
  const res = await authFetch(`${API_URL}/admin/press`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al crear nota");
  return res.json();
}

export async function updatePressArticle(id: string, dto: Partial<PressArticle>): Promise<PressArticle> {
  const res = await authFetch(`${API_URL}/admin/press/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar nota");
  return res.json();
}

export async function deletePressArticle(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/press/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar nota");
}

// ─── Support Tickets ──────────────────────────────────────────

export interface SupportTicket {
  id: string;
  ticket_number: string;
  name: string;
  email: string;
  subject: string;
  description: string;
  images: string[];
  files: string[];
  status: string;
  response: string | null;
  created_at: string;
}

export async function createSupportTicket(dto: Partial<SupportTicket>): Promise<SupportTicket> {
  const res = await fetch(`${API_URL}/support/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Error al crear ticket");
  return res.json();
}

export async function getSupportTicket(ticketNumber: string): Promise<SupportTicket> {
  const res = await fetch(`${API_URL}/support/tickets/${ticketNumber}`);
  if (!res.ok) throw new Error("Ticket no encontrado");
  return res.json();
}

export async function getAdminSupportTickets(): Promise<SupportTicket[]> {
  const res = await authFetch(`${API_URL}/admin/support`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function updateSupportTicket(id: string, dto: Partial<SupportTicket>): Promise<SupportTicket> {
  const res = await authFetch(`${API_URL}/admin/support/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function deleteSupportTicket(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/support/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar ticket");
}

export async function deleteNewsletterSubscriber(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/newsletter/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar");
}

export async function exportNewsletterCsv() {
  const res = await authFetch(`${API_URL}/admin/newsletter/export`);
  if (!res.ok) throw new Error("Error al exportar");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "suscriptores-newsletter.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Blog ─────────────────────────────────────────────────────

export async function getBlogPosts(): Promise<BlogPost[]> {
  const res = await fetch(`${API_URL}/blog`);
  if (!res.ok) throw new Error("Error al obtener artículos");
  return res.json();
}

export async function getBlogPost(slug: string): Promise<BlogPost> {
  const res = await fetch(`${API_URL}/blog/${slug}`);
  if (!res.ok) throw new Error("Error al obtener artículo");
  return res.json();
}

export async function getAdminBlogPosts(): Promise<BlogPost[]> {
  const res = await authFetch(`${API_URL}/admin/blog`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminBlogPost(id: string): Promise<BlogPost> {
  const res = await authFetch(`${API_URL}/admin/blog/${id}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createBlogPost(dto: Partial<BlogPost>): Promise<BlogPost> {
  const res = await authFetch(`${API_URL}/admin/blog`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al crear artículo");
  return res.json();
}

export async function updateBlogPost(id: string, dto: Partial<BlogPost>): Promise<BlogPost> {
  const res = await authFetch(`${API_URL}/admin/blog/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar artículo");
  return res.json();
}

export async function deleteBlogPost(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/blog/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar artículo");
}

// ─── Multipart auth helper ────────────────────────────────────

async function multipartAuth(url: string, method: string, fields: Record<string, any>): Promise<any> {
  const token = getAccessToken();
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value instanceof File) fd.append(key, value);
    else if (value !== undefined && value !== null && value !== "") fd.append(key, String(value));
  }

  let res = await fetch(url, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(url, {
        method,
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

export async function saveBankAccount(dto: { bank_name: string; account_number: string; account_holder?: string; account_type?: string }) {
  const res = await authFetch(`${API_URL}/auth/bank-account`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al guardar cuenta bancaria");
  return res.json();
}

export async function updateBankAccount(id: string, dto: { bank_name?: string; account_number?: string; account_holder?: string; account_type?: string }) {
  const res = await authFetch(`${API_URL}/auth/bank-account/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar cuenta");
  return res.json();
}

export async function deleteBankAccount(id: string) {
  const res = await authFetch(`${API_URL}/auth/bank-account/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar cuenta");
  return res.json();
}

export async function getBankAccounts() {
  const res = await authFetch(`${API_URL}/auth/bank-accounts`);
  if (!res.ok) throw new Error("Error al obtener cuentas bancarias");
  return res.json();
}

export async function getAdminOrders(status?: string, page: number = 1, limit: number = 20): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`${API_URL}/admin/orders${qs}`);
  if (!res.ok) throw new Error("Error al obtener pedidos");
  return res.json();
}

export async function approveOrderPayment(id: string) {
  const res = await authFetch(`${API_URL}/admin/orders/${id}/approve`, { method: "PATCH" });
  if (!res.ok) throw new Error("Error al aprobar pago");
  return res.json();
}

export async function rejectOrderPayment(id: string, motivo: string) {
  const res = await authFetch(`${API_URL}/admin/orders/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error("Error al rechazar pago");
  return res.json();
}

export async function updateOrderStatus(id: string, status: string) {
  const res = await authFetch(`${API_URL}/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Error al actualizar estado");
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

export async function getAdminDashboard() {
  const res = await authFetch(`${API_URL}/admin/dashboard`);
  if (!res.ok) throw new Error("Error al cargar dashboard admin");
  return res.json();
}

export async function getAuditLogs(filters?: { action?: string; entity?: string }) {
  const params = new URLSearchParams();
  if (filters?.action) params.set("action", filters.action);
  if (filters?.entity) params.set("entity", filters.entity);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`${API_URL}/admin/audit${qs}`);
  if (!res.ok) throw new Error("Error al cargar auditoría");
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

export async function getAdminClaims() {
  const res = await authFetch(`${API_URL}/admin/orders/claims`);
  if (!res.ok) throw new Error("Error al cargar reclamos");
  return res.json();
}

export async function updateClaimStatus(id: string, status: string) {
  const res = await authFetch(`${API_URL}/admin/orders/claims/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Error al actualizar reclamo");
  return res.json();
}

export async function getMyPlan(): Promise<any> {
  const res = await authFetch(`${API_URL}/auth/my-plan`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function selectPlan(planId: string): Promise<any> {
  const res = await authFetch(`${API_URL}/auth/select-plan`, {
    method: "POST",
    body: JSON.stringify({ plan_id: planId }),
  });
  if (!res.ok) throw new Error("Error al seleccionar plan");
  return res.json();
}

export async function getMyOrders() {
  const res = await authFetch(`${API_URL}/checkout/orders`);
  if (!res.ok) throw new Error("Error al obtener pedidos");
  return res.json();
}

export async function submitPlanPayment(data: {
  operation_number: string;
  amount: number;
  origin_account_id?: string;
  proof: File;
}) {
  const token = getAccessToken();
  const fd = new FormData();
  fd.append("operation_number", data.operation_number);
  fd.append("amount", String(data.amount));
  if (data.origin_account_id) fd.append("origin_account_id", data.origin_account_id);
  fd.append("proof", data.proof);

  let res = await fetch(`${API_URL}/auth/submit-payment`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(`${API_URL}/auth/submit-payment`, {
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

export async function submitCheckout(data: {
  items: { id: string; price: number }[];
  origin_account_id: string;
  operation_number: string;
  amount: number;
  proof: File;
}) {
  const token = getAccessToken();
  const fd = new FormData();
  fd.append("items", JSON.stringify(data.items));
  fd.append("origin_account_id", data.origin_account_id);
  fd.append("operation_number", data.operation_number);
  fd.append("amount", String(data.amount));
  fd.append("proof", data.proof);

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

// ─── Messages ─────────────────────────────────────────────────

export interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  buyer_email: string;
  buyer_first_name: string;
  buyer_last_name: string;
  buyer_avatar: string | null;
  seller_email: string;
  seller_first_name: string;
  seller_last_name: string;
  seller_avatar: string | null;
  product_title: string | null;
  product_images: string | null;
  unread_count: number;
}

export interface MessageData {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  read_at: string | null;
  created_at: string;
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await authFetch(`${API_URL}/messages/conversations`);
  if (!res.ok) throw new Error("Error al obtener conversaciones");
  return res.json();
}

export async function createOrGetConversation(sellerId: string, productId?: string): Promise<Conversation> {
  const res = await authFetch(`${API_URL}/messages/conversations`, {
    method: "POST",
    body: JSON.stringify({ seller_id: sellerId, product_id: productId }),
  });
  if (!res.ok) throw new Error("Error al crear conversación");
  return res.json();
}

export async function getMessages(conversationId: string): Promise<MessageData[]> {
  const res = await authFetch(`${API_URL}/messages/conversations/${conversationId}`);
  if (!res.ok) throw new Error("Error al obtener mensajes");
  return res.json();
}

export async function sendMessage(conversationId: string, text: string): Promise<MessageData> {
  const res = await authFetch(`${API_URL}/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Error al enviar mensaje");
  return res.json();
}

export async function getUnreadCount(): Promise<{ unread: number }> {
  const res = await authFetch(`${API_URL}/messages/unread-count`);
  if (!res.ok) return { unread: 0 };
  return res.json();
}

export async function markAsRead(messageId: string): Promise<void> {
  await authFetch(`${API_URL}/messages/${messageId}/read`, { method: "PUT" });
}

export async function markAllAsRead(conversationId: string): Promise<void> {
  await authFetch(`${API_URL}/messages/conversations/${conversationId}/read-all`, { method: "PUT" });
}

// ─── Reviews ──────────────────────────────────────────────────

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string;
  rating: number;
  comment: string;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_title?: string;
  product_sku?: string;
  operation_number?: string;
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
}

export async function createReview(dto: { product_id: string; order_id: string; rating: number; comment?: string; images?: string[] }): Promise<Review> {
  const res = await authFetch(`${API_URL}/reviews`, {
    method: "POST", body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}

export async function getMyReviews(): Promise<Review[]> {
  const res = await authFetch(`${API_URL}/reviews/mine`);
  if (!res.ok) throw new Error("Error al obtener reseñas");
  return res.json();
}

export async function getOrderReviews(orderId: string): Promise<Review[]> {
  const res = await authFetch(`${API_URL}/reviews/order/${orderId}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getSellerReviews(): Promise<Review[]> {
  const res = await authFetch(`${API_URL}/reviews/seller`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminReviews(page: number = 1, limit: number = 20): Promise<{ data: Review[]; total: number; page: number; totalPages: number }> {
  const res = await authFetch(`${API_URL}/admin/reviews?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function adminDeleteReview(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/reviews/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar reseña");
}
