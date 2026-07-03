"use client";

import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "lotifyx_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] bg-white border-t border-gray-200 shadow-2xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cookie className="h-5 w-5 text-[#8234FE]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Este sitio utiliza cookies</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Utilizamos cookies propias y de terceros para mejorar tu experiencia, personalizar contenido y analizar el tráfico. 
              Al hacer clic en "Aceptar todas", consientes su uso. Puedes obtener más información en nuestra{" "}
              <a href="/politica-de-cookies" className="text-[#8234FE] hover:underline">Política de cookies</a>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={accept}
            className="rounded-xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm whitespace-nowrap">
            Aceptar todas
          </button>
          <button onClick={accept}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
