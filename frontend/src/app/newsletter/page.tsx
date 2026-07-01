"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Mail, Bell, Sparkles, Shield, ChevronDown, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const benefits = [
  {
    icon: Sparkles,
    title: "Ofertas exclusivas",
    desc: "Recibe promociones y descuentos especiales antes que nadie, directamente en tu bandeja de entrada.",
  },
  {
    icon: Bell,
    title: "Novedades y lanzamientos",
    desc: "Entérate primero de los nuevos productos, categorías y vendedores destacados en la plataforma.",
  },
  {
    icon: Mail,
    title: "Contenido de valor",
    desc: "Guías, consejos y tendencias del comercio electrónico para que saques el máximo provecho a Lotifyx.",
  },
  {
    icon: Shield,
    title: "Sin spam",
    desc: "Solo enviaremos información relevante. Puedes darte de baja en cualquier momento con un clic.",
  },
];

export default function NewsletterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast.error("El correo electrónico es obligatorio"); return; }
    if (!consent) { toast.error("Debes aceptar la política de privacidad"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al suscribirte");
      setSubscribed(true);
      toast.success("¡Te has suscrito correctamente!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-[#f5f6f8]">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-10 text-gray-400 justify-center">
            <Link href="/" className="hover:text-gray-600 transition-colors">Inicio</Link>
            <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
            <span className="text-[#8234FE] font-semibold">Newsletter</span>
          </nav>

          {subscribed ? (
            /* Success state */
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 sm:p-16 text-center max-w-lg mx-auto">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Estás dentro!</h2>
              <p className="text-gray-500 mb-6">
                Gracias por suscribirte{name ? `, ${name}` : ""}. Te enviaremos las mejores ofertas y novedades a <strong className="text-gray-700">{email}</strong>.
              </p>
              <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-all">
                Volver al inicio
              </Link>
            </div>
          ) : (
            <>
              {/* 1. Title */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-4">
                  <Mail className="h-3.5 w-3.5" />
                  Newsletter
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-[#161A3A] leading-tight mb-4">
                  No te pierdas{" "}
                  <span className="bg-gradient-to-r from-[#8234FE] to-[#26BEFE] bg-clip-text text-transparent">nada</span>
                </h1>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                  Suscríbete a nuestro newsletter y recibe las mejores ofertas, novedades y contenido exclusivo directamente en tu correo.
                </p>
              </div>

              {/* 3. Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {benefits.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 hover:shadow-sm transition-shadow">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#8234FE]/10 to-[#26BEFE]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-[#8234FE]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{b.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 4. Form */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10 max-w-lg mx-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Únete ahora</h2>
                <p className="text-sm text-gray-500 mb-6">Solo necesitamos tu correo para empezar</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 focus:bg-white transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico <span className="text-red-500">*</span></label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 focus:bg-white transition-all" />
                  </div>

                  {/* 5. Consent */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <span className="text-xs text-gray-500 leading-relaxed">
                      He leído y acepto la{" "}
                      <a href="#" className="text-purple-600 hover:underline font-medium" onClick={e => e.preventDefault()}>Política de privacidad</a>{" "}
                      y deseo recibir comunicaciones comerciales de Lotifyx.
                    </span>
                  </label>

                  <button type="submit" disabled={submitting}
                    className="w-full rounded-xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-3 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm disabled:opacity-60">
                    {submitting ? "Suscribiendo..." : "Suscribirme al newsletter"}
                  </button>
                </form>

                {/* 6. Privacy */}
                <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed">
                  Al suscribirte, aceptas que tus datos sean gestionados según nuestra{" "}
                  <a href="#" className="text-purple-600 hover:underline" onClick={e => e.preventDefault()}>Política de privacidad</a>.
                  Puedes darte de baja en cualquier momento.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
