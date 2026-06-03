const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// ─── Token helpers ───────────────────────────────────────────

const ACCESS_KEY = "lotifyx_access";
const REFRESH_KEY = "lotifyx_refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function removeTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// ─── Auto-refresh ────────────────────────────────────────────

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!res.ok) {
      removeTokens();
      return null;
    }

    const data = await res.json();
    if (data.accessToken && data.refreshToken) {
      setTokens(data.accessToken, data.refreshToken);
    }
    return data.accessToken || null;
  } catch {
    return null;
  }
}

// ─── Authenticated fetch ─────────────────────────────────────

async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
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
  ruc: string;
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
  refreshToken: string;
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

  return data;
}

export async function logoutUser() {
  const refresh = getRefreshToken();
  if (refresh) {
    await authFetch(`${API_URL}/auth/logout`, {
      method: "POST",
      body: JSON.stringify({ refreshToken: refresh }),
    }).catch(() => {});
  }
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
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("title", title);
  formData.append("image", file);

  const res = await fetch(`${API_URL}/banners`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Error" }));
    throw new Error(err.message || "Error al crear banner");
  }

  return res.json();
}

export async function deleteBanner(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/banners/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar banner");
}

export async function updateBanner(id: string, title: string, file?: File): Promise<Banner> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("title", title);
  if (file) formData.append("image", file);

  const res = await fetch(`${API_URL}/banners/${id}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Error" }));
    throw new Error(err.message || "Error al actualizar banner");
  }

  return res.json();
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
  const token = getAccessToken();
  const fd = new FormData();
  fd.append("name", name);
  fd.append("image", file);

  const res = await fetch(`${API_URL}/marquees`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}

export async function updateMarquee(id: string, name: string, file?: File): Promise<Marquee> {
  const token = getAccessToken();
  const fd = new FormData();
  fd.append("name", name);
  if (file) fd.append("image", file);

  const res = await fetch(`${API_URL}/marquees/${id}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
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
