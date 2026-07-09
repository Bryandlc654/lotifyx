import { API_URL, authFetch, setTokens, removeTokens, getRefreshToken } from "./client";

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

export function getGoogleAuthUrl(): string {
  return `${API_URL}/auth/google`;
}

export function handleGoogleCallback(
  accessToken: string,
  refreshToken: string
) {
  setTokens(accessToken, refreshToken);
}
