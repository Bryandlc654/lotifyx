import { emitSessionExpired } from "../session";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api";
const UPLOADS_URL = API_URL.replace(/\/api$/, "");

export function getImageUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${UPLOADS_URL}${path}`;
}

const ACCESS_KEY = "lotifyx_access";
const REFRESH_KEY = "lotifyx_refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  const stored = localStorage.getItem(REFRESH_KEY);
  if (stored) return stored;
  return getAccessToken();
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

export { API_URL, UPLOADS_URL, refreshAccessToken, multipartAuth };
