"use client";

import { useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Get token from URL on mount
  if (typeof window !== "undefined" && !token) {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-])/.test(password)) {
      toast.error("Debe contener mayúscula, minúscula, número y carácter especial");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Contraseña actualizada. Ya puedes iniciar sesión.");
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || "Error al restablecer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex relative">
      <Link href="/login" className="absolute top-4 left-4 z-10 p-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-gray-500 hover:text-primary-600 transition-all shadow-sm">
        <Home className="h-5 w-5" />
      </Link>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md">
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Listo!</h1>
              <p className="text-gray-500 mb-6">Tu contraseña ha sido actualizada.</p>
              <Link href="/login" className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-6 py-2.5 text-sm font-semibold text-white shadow-sm">
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Nueva contraseña</h1>
              <p className="text-gray-500 text-sm mb-6">Ingresa tu nueva contraseña.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Nueva contraseña" required
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                <button type="submit" disabled={loading || !token}
                  className="w-full rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50">
                  {loading ? "Actualizando..." : "Cambiar contraseña"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-[#8234FE] to-[#26BEFE]" />
    </main>
  );
}
