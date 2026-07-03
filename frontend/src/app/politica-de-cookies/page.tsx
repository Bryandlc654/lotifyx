"use client";

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChevronDown, Shield, Cookie, Lock, Settings, Info } from "lucide-react";

const cookies = [
  {
    title: "Cookies técnicas (necesarias)",
    desc: "Son esenciales para el funcionamiento de la plataforma. Permiten la autenticación, la seguridad y la funcionalidad básica del sitio.",
    examples: ["Token de sesión (refreshToken)", "Token CSRF (csrf_token)", "Identificador de carrito (cart_id)"],
    icon: Settings,
    always: true,
  },
  {
    title: "Cookies de preferencias",
    desc: "Permiten recordar tus preferencias y personalizar tu experiencia en Lotifyx.",
    examples: ["Idioma seleccionado", "Moneda preferida", "Tema visual"],
    icon: Info,
  },
  {
    title: "Cookies de marketing y afiliados",
    desc: "Se utilizan para rastrear referidos y campañas de afiliados. Nos ayudan a medir la efectividad de nuestras promociones.",
    examples: ["Código de referido (referral_code)"],
    icon: Cookie,
  },
  {
    title: "Cookies de seguridad",
    desc: "Protegen tu cuenta contra accesos no autorizados y ataques CSRF. Son fundamentales para mantener la integridad de tus datos.",
    examples: ["Token CSRF (csrf_token)", "Refresh token (httpOnly)"],
    icon: Lock,
  },
];

export default function PoliticaCookiesPage() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-[#f5f6f8]">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <nav className="flex items-center gap-2 text-sm mb-8 text-gray-400">
            <Link href="/" className="hover:text-gray-600 transition-colors">Inicio</Link>
            <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
            <span className="text-[#8234FE] font-semibold">Política de Cookies</span>
          </nav>

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Política de Cookies</h1>
                <p className="text-sm text-gray-500">Última actualización: 30 de junio de 2026</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              En Lotifyx utilizamos cookies y tecnologías similares para garantizar el funcionamiento seguro de la plataforma, 
              mejorar tu experiencia, rastrear referidos de afiliados y recordar tus preferencias. 
              Esta política explica qué cookies utilizamos, por qué las usamos y cómo puedes gestionarlas.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-br from-[#8234FE] to-[#26BEFE] rounded-2xl p-8 sm:p-10 text-white text-center">
            <h2 className="text-xl font-bold mb-2">¿Tienes dudas?</h2>
            <p className="text-white/80 text-sm mb-6">Si tienes preguntas sobre nuestra política de cookies, contáctanos.</p>
            <Link href="/soporte" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#8234FE] hover:bg-gray-100 transition-all">
              Contactar soporte
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
