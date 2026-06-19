"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { createLead } from "@/lib/api";

const countries = [
  { code: "+1", label: "US" },
  { code: "+52", label: "MX" },
  { code: "+34", label: "ES" },
  { code: "+51", label: "PE" },
  { code: "+54", label: "AR" },
  { code: "+56", label: "CL" },
  { code: "+57", label: "CO" },
  { code: "+58", label: "VE" },
  { code: "+593", label: "EC" },
  { code: "+502", label: "GT" },
  { code: "+503", label: "SV" },
  { code: "+504", label: "HN" },
  { code: "+505", label: "NI" },
  { code: "+506", label: "CR" },
  { code: "+507", label: "PA" },
  { code: "+509", label: "DO" },
  { code: "+591", label: "BO" },
  { code: "+595", label: "PY" },
  { code: "+598", label: "UY" },
  { code: "+55", label: "BR" },
];

export default function ContactoPage() {
  const [country, setCountry] = useState(countries[2]);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", message: "", privacy: false });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.privacy) return;
    setSending(true);
    try {
      await createLead({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        message: form.message,
      });
      setSent(true);
    } catch {
      alert("Error al enviar el mensaje. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-[#F4F6F7] min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="max-w-6xl w-full flex flex-col md:flex-row min-h-[800px] mt-28">
          {/* Form */}
          <section className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Ponte en contacto</h1>
              <p className="text-gray-500 mb-10 text-lg">Nuestro equipo estará encantado de ayudarte.</p>

              {sent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">¡Mensaje enviado!</h3>
                  <p className="text-gray-500">Te responderemos a la brevedad.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="first-name">Nombres</label>
                      <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required
                        className="w-full border-gray-300 rounded-lg py-2.5 px-4 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-gray-900" id="first-name" placeholder="Nombres" type="text" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="last-name">Apellidos</label>
                      <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required
                        className="w-full border-gray-300 rounded-lg py-2.5 px-4 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-gray-900" id="last-name" placeholder="Apellido" type="text" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                      className="w-full border-gray-300 rounded-lg py-2.5 px-4 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-gray-900" id="email" placeholder="colocar@correoelectronico.com" type="email" />
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">Phone number</label>
                      <div className="relative mt-1 flex rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <select value={country.code} onChange={e => { const c = countries.find(x => x.code === e.target.value) || countries[0]; setCountry(c); setForm({ ...form, phone: c.code + " " }) }}
                            className="h-full rounded-l-lg border-gray-300 bg-transparent py-0 pl-3 pr-7 text-gray-500 focus:ring-[#7F56D9] focus:border-[#7F56D9] sm:text-sm">
                            {countries.map(c => <option key={c.code} value={c.code}>{c.label} {c.code}</option>)}
                          </select>
                        </div>
                        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                          className="block w-full flex-1 rounded-none rounded-r-lg border-gray-300 focus:ring-[#7F56D9] focus:border-[#7F56D9] py-2.5 px-4 text-gray-900" id="phone" placeholder="+XXX (###) ###-####" type="tel" />
                      </div>
                    </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="message">Mensaje</label>
                    <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={4}
                      className="w-full border-gray-300 rounded-lg py-2.5 px-4 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-gray-900" id="message" placeholder="Enviar su mensaje..." />
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input checked={form.privacy} onChange={e => setForm({ ...form, privacy: e.target.checked })}
                        className="h-4 w-4 text-[#7F56D9] border-gray-300 rounded focus:ring-[#7F56D9]" id="privacy" type="checkbox" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="text-gray-500" htmlFor="privacy">Aceptas nuestra amigable <a href="/privacidad" className="underline font-medium text-gray-700">política de privacidad.</a></label>
                    </div>
                  </div>
                  <button type="submit" disabled={sending || !form.privacy}
                    className="w-full bg-gradient-to-r from-[#7F56D9] to-[#2E90FA] text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                    {sending ? "Enviando..." : "Enviar mensaje"}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* Visual panel */}
          <section className="w-full md:w-1/2 relative overflow-hidden" style={{ background: "linear-gradient(to right bottom, #7C3AED, #3B82F6)" }}>
            <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
              <div className="mt-24">
                <p className="text-xl font-medium mb-4">Todo lo que buscas, <br /> en un solo lugar.</p>
                <div className="space-y-2">
                  <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight">
                    <span className="inline-block" style={{ backgroundColor: "#00D1FF", color: "white", padding: "0 8px" }}>Descúbrelo</span>
                  </h2>
                  <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight">
                    <span className="inline-block" style={{ backgroundColor: "white", color: "#101828", padding: "0 8px" }}>en Lotifyx.</span>
                  </h2>
                </div>
              </div>
              <div className="flex items-end justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="bg-white p-2 rounded-lg">
                    <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#7F56D9" />
                      <path d="M2 17L12 22L22 17" stroke="#7F56D9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      <path d="M2 12L12 17L22 12" stroke="#7F56D9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold tracking-tight">lotifyx</span>
                </div>
                <p className="text-xs text-white/80">© 2077 Untitled UI. All rights reserved.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
