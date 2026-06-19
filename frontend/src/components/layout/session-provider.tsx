"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { onSessionExpired } from "@/lib/session";
import { loginUser, getProfile, getGoogleAuthUrl, isAuthenticated, setTokens } from "@/lib/api";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const pendingUrl = useRef<string | null>(null);

  useEffect(() => {
    return onSessionExpired(() => setShowLogin(true));
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser({ credential, contrasena: password });
      setTokens(res.accessToken, res.refreshToken);
      toast.success("Sesión reanudada");
      setShowLogin(false);
      setCredential("");
      setPassword("");
    } catch (err: any) {
      toast.error(err.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  }, [credential, password]);

  if (!showLogin) return <>{children}</>;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                <Loader2 className="h-7 w-7 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Sesión expirada</h2>
              <p className="text-sm text-gray-500 mt-1">Tu sesión ha expirado. Inicia sesión nuevamente para continuar.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="session-credential">
                  Correo electrónico o teléfono
                </label>
                <input id="session-credential" type="text" value={credential} onChange={e => setCredential(e.target.value)}
                  required className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="ejemplo@correo.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="session-password">Contraseña</label>
                <div className="relative">
                  <input id="session-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    required className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm font-semibold">
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">O continúa con</span></div>
            </div>

            <a href={getGoogleAuthUrl()}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
