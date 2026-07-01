"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Mail, ChevronDown, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function CancelarSuscripcionPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast.error("Ingresa tu correo electrónico"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/newsletter/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cancelar");
      setResult("success");
    } catch (e: any) {
      toast.error(e.message);
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 py-12 w-full">
          <nav className="flex items-center gap-2 text-sm mb-8 text-gray-400 justify-center">
            <Link href="/" className="hover:text-gray-600 transition-colors">Inicio</Link>
            <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
            <Link href="/newsletter" className="hover:text-gray-600 transition-colors">Newsletter</Link>
            <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
            <span className="text-[#8234FE] font-semibold">Cancelar suscripción</span>
          </nav>

          {result === "success" ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Suscripción cancelada</h2>
              <p className="text-sm text-gray-500 mb-6">
                El correo <strong className="text-gray-700">{email}</strong> ha sido dado de baja del newsletter. Ya no recibirás más comunicaciones.
              </p>
              <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all">
                Volver al inicio
              </Link>
            </div>
          ) : result === "error" ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No se pudo cancelar</h2>
              <p className="text-sm text-gray-500 mb-4">No encontramos una suscripción activa con ese correo. ¿Quizás ya estabas dado de baja?</p>
              <button onClick={() => setResult(null)} className="text-sm text-purple-600 hover:underline font-medium">
                Intentar con otro correo
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Cancelar suscripción</h1>
                <p className="text-sm text-gray-500 mt-2">Ingresa tu correo para dejar de recibir el newsletter</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 focus:bg-white transition-all" />
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600 transition-all disabled:opacity-60">
                  {submitting ? "Cancelando..." : "Cancelar suscripción"}
                </button>
              </form>

              <p className="text-xs text-gray-400 text-center mt-4">
                ¿Cambiaste de opinión?{" "}
                <Link href="/newsletter" className="text-purple-600 hover:underline font-medium">Volver a suscribirte</Link>
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
