"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getFaqs, Faq } from "@/lib/api";

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getFaqs().then(d => { setFaqs(d); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const grouped: Record<string, Faq[]> = {};
  faqs.forEach(f => { if (!grouped[f.category]) grouped[f.category] = []; grouped[f.category].push(f); });

  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Header */}
        <header className="text-white text-center py-20 px-4" style={{ background: "linear-gradient(135deg, #8A3FFC 0%, #00CFFF 100%)" }}>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">Preguntas frecuentes</h1>
            <p className="text-xl md:text-2xl font-semibold mb-4 text-white">¿Qué es Lotifyx? ¿Cómo creo mi cuenta?</p>
            <p className="text-lg md:text-xl text-white">Respondemos todas tus preguntas para que puedas vender por internet fácil y profesionalmente.</p>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-6xl mx-auto py-16 px-6">
          {!loaded ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"/></div>
          ) : Object.keys(grouped).length === 0 ? (
            <p className="text-center text-gray-400 py-12">No hay preguntas frecuentes aún.</p>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <section key={category} className="flex flex-col md:flex-row mb-16 gap-8">
                <div className="md:w-1/4">
                  <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                  <div className="h-1 w-16 bg-indigo-500 mt-2" />
                </div>
                <div className="md:w-3/4 space-y-2">
                  {items.map(f => (
                    <div key={f.id} className="border-b border-slate-100 last:border-b-0 py-4">
                      <div className="flex justify-between items-center cursor-pointer" onClick={() => setOpen(open === f.id ? null : f.id)}>
                        <h3 className="text-base font-semibold text-gray-800">{f.question}</h3>
                        <span className="text-slate-400 flex-shrink-0 ml-4">
                          {open === f.id ? (
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          ) : (
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          )}
                        </span>
                      </div>
                      {open === f.id && (
                        <div className="mt-2 text-sm text-slate-500 max-w-2xl leading-relaxed">{f.answer}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {/* CTA */}
        <div className="max-w-6xl mx-auto px-6 pb-16">
          <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center min-h-[300px]" style={{ background: "linear-gradient(135deg, #8A3FFC 0%, #00CFFF 100%)" }}>
            <div className="z-10 w-full md:w-1/2 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">¿No encontrás la respuesta<br/>a tu pregunta?</h2>
              <button className="bg-white text-purple-700 font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-all text-sm md:text-base">Habla con un asesor</button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
