const FRIENDLY_MAP: Record<string, string> = {
  "Internal server error": "Ocurrió un error inesperado. Inténtalo de nuevo.",
  "error interno del servidor": "Ocurrió un error inesperado. Inténtalo de nuevo.",
  unauthorized: "Tu sesión expiró. Inicia sesión nuevamente.",
  "jwt expired": "Tu sesión expiró. Inicia sesión nuevamente.",
  "jwt malformed": "Tu sesión no es válida. Inicia sesión nuevamente.",
  "invalid signature": "Tu sesión no es válida. Inicia sesión nuevamente.",
  "too many requests": "Demasiados intentos. Intenta de nuevo en unos momentos.",
  "failed to fetch": "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
  networkerror: "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
  "network request failed": "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
  "fetch failed": "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
  error: "Ocurrió un error. Inténtalo de nuevo.",
};

export function getErrorMessage(err: any, fallback = "Ocurrió un error. Inténtalo de nuevo."): string {
  let msg: unknown;
  if (typeof err === "string") {
    msg = err;
  } else if (err instanceof Error) {
    msg = err.message;
  } else if (err && typeof err === "object") {
    const data = (err as any).response?.data ?? err;
    msg = data?.message ?? (err as any).message;
  }

  if (Array.isArray(msg)) msg = msg.join(", ");
  const text = String(msg ?? "").trim();
  if (!text) return fallback;

  const lower = text.toLowerCase();
  for (const [key, friendly] of Object.entries(FRIENDLY_MAP)) {
    if (lower === key || lower.startsWith(key)) return friendly;
  }
  return text;
}
