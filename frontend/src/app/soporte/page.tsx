"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { createSupportTicket, getSupportTicket, SupportTicket } from "@/lib/api";
import { ChevronDown, HelpCircle, BookOpen, Play, Mail, Phone, MessageCircle, Clock, Search, Send, Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const statusLabels: Record<string, string> = { open: "Abierto", in_progress: "En progreso", resolved: "Resuelto", closed: "Cerrado" };
const statusColors: Record<string, string> = { open: "bg-yellow-50 text-yellow-700", in_progress: "bg-blue-50 text-blue-700", resolved: "bg-green-50 text-green-700", closed: "bg-gray-100 text-gray-600" };
const statusIcons: Record<string, any> = { open: AlertCircle, in_progress: Loader2, resolved: CheckCircle, closed: XCircle };

export default function SoportePage() {
  const [tab, setTab] = useState<"reportar" | "seguimiento">("reportar");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", description: "" });
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null);

  const [trackNumber, setTrackNumber] = useState("");
  const [trackResult, setTrackResult] = useState<SupportTicket | null>(null);
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState("");

  async function uploadFile(file: File, type: "image" | "file") {
    const fd = new FormData();
    fd.append("file", file);
    const endpoint = type === "image" ? "/uploads/image" : "/uploads/file";
    const res = await fetch(`${API_URL}${endpoint}`, { method: "POST", body: fd });
    const data = await res.json();
    return data.url;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, type);
      if (type === "image") setImages(prev => [...prev, url]);
      else setFiles(prev => [...prev, url]);
    } catch { toast.error("Error al subir archivo"); }
    finally { setUploading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.description.trim()) {
      toast.error("Todos los campos son obligatorios"); return;
    }
    setSending(true);
    try {
      const ticket = await createSupportTicket({ ...form, images, files });
      setCreatedTicket(ticket);
      toast.success("Ticket creado");
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  }

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!trackNumber.trim()) { toast.error("Ingresa un número de ticket"); return; }
    setTracking(true); setTrackError("");
    try {
      const ticket = await getSupportTicket(trackNumber.trim());
      setTrackResult(ticket);
    } catch { setTrackError("Ticket no encontrado. Verifica el número ingresado."); setTrackResult(null); }
    finally { setTracking(false); }
  }

  const statusIcon = (s: string) => { const Icon = statusIcons[s] || AlertCircle; return <Icon className={`h-4 w-4 ${s === "in_progress" ? "animate-spin" : ""}`} />; };

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-[#f5f6f8]">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#8234FE] to-[#26BEFE] text-white">
          <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Soporte</h1>
            <p className="text-white/80 max-w-lg mx-auto">Estamos aquí para ayudarte. Reporta un problema o consulta el estado de tu ticket.</p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-12">
          <nav className="flex items-center gap-2 text-sm mb-8 text-gray-400">
            <Link href="/" className="hover:text-gray-600 transition-colors">Inicio</Link>
            <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
            <span className="text-[#8234FE] font-semibold">Soporte</span>
          </nav>

          {/* Tabs */}
          <div className="flex gap-3 mb-8">
            <button onClick={() => setTab("reportar")} className={`w-fit px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "reportar" ? "bg-gradient-to-br from-[#8234FE] to-[#26BEFE] text-white shadow-sm" : "bg-[#E7EAEB] text-[#161A3A] hover:opacity-80"}`}>Reportar un problema</button>
            <button onClick={() => setTab("seguimiento")} className={`w-fit px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "seguimiento" ? "bg-gradient-to-br from-[#8234FE] to-[#26BEFE] text-white shadow-sm" : "bg-[#E7EAEB] text-[#161A3A] hover:opacity-80"}`}>Seguimiento de tickets</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            {/* Main */}
            <div>
              {tab === "reportar" ? (
                createdTicket ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Ticket creado</h2>
                    <p className="text-sm text-gray-500 mb-4">Hemos recibido tu solicitud. Tu número de ticket es:</p>
                    <p className="text-2xl font-bold text-[#8234FE] mb-6 font-mono">{createdTicket.ticket_number}</p>
                    <p className="text-xs text-gray-400">Guarda este número para dar seguimiento a tu solicitud.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Reportar un problema</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium text-gray-700">Nombre <span className="text-red-500">*</span></label>
                          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tu nombre" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 focus:bg-white transition-all" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium text-gray-700">Correo <span className="text-red-500">*</span></label>
                          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@correo.com" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 focus:bg-white transition-all" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Asunto <span className="text-red-500">*</span></label>
                        <input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Ej: Problema con mi pedido" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 focus:bg-white transition-all" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Descripción <span className="text-red-500">*</span></label>
                        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe tu problema en detalle..." className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 focus:bg-white transition-all resize-none" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium text-gray-700">Adjuntar imágenes</label>
                          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors">
                            <Upload className="h-4 w-4" />
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, "image")} disabled={uploading} />
                            {uploading ? "Subiendo..." : images.length > 0 ? `${images.length} imagen(es)` : "Subir imágenes"}
                          </label>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium text-gray-700">Adjuntar archivos</label>
                          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors">
                            <FileText className="h-4 w-4" />
                            <input type="file" className="hidden" onChange={e => handleFileChange(e, "file")} disabled={uploading} />
                            {uploading ? "Subiendo..." : files.length > 0 ? `${files.length} archivo(s)` : "Subir archivos"}
                          </label>
                        </div>
                      </div>
                      <button type="submit" disabled={sending} className="w-full rounded-xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-3 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
                        {sending ? <>Enviando... <Loader2 className="h-4 w-4 animate-spin" /></> : <><Send className="h-4 w-4" /> Enviar ticket</>}
                      </button>
                    </form>
                  </div>
                )
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Seguimiento de tickets</h2>
                  <p className="text-sm text-gray-500 mb-6">Ingresa el número de ticket que recibiste para consultar su estado.</p>
                  <form onSubmit={handleTrack} className="flex gap-3 mb-6">
                    <input type="text" value={trackNumber} onChange={e => setTrackNumber(e.target.value.toUpperCase())} placeholder="Ej: TKT-20250630-XXXX" className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 focus:bg-white transition-all font-mono" />
                    <button type="submit" disabled={tracking} className="rounded-xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm disabled:opacity-60 flex items-center gap-2">
                      <Search className="h-4 w-4" /> Buscar
                    </button>
                  </form>

                  {tracking && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>}

                  {trackError && (
                    <div className="text-center py-8">
                      <XCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">{trackError}</p>
                    </div>
                  )}

                  {trackResult && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-gray-400">Ticket</p>
                          <p className="text-sm font-mono font-bold text-gray-900">{trackResult.ticket_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Estado</p>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColors[trackResult.status] || "bg-gray-100"}`}>
                            {statusIcon(trackResult.status)} {statusLabels[trackResult.status] || trackResult.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mb-4">Creado: {new Date(trackResult.created_at).toLocaleString("es-PE")}</div>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-1 mb-4">
                        <p className="text-xs text-gray-400">Asunto</p>
                        <p className="text-sm font-semibold text-gray-900">{trackResult.subject}</p>
                        <p className="text-xs text-gray-400 mt-2">Descripción</p>
                        <p className="text-sm text-gray-700">{trackResult.description}</p>
                      </div>
                      {trackResult.response && (
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                          <p className="text-xs font-semibold text-purple-700 mb-1">Respuesta del soporte</p>
                          <p className="text-sm text-gray-700">{trackResult.response}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Información de contacto</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center"><Mail className="h-4 w-4 text-purple-600" /></div>
                    <div><p className="font-medium text-gray-900">Correo</p><p className="text-xs text-gray-500">soporte@lotifyx.com</p></div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center"><MessageCircle className="h-4 w-4 text-green-600" /></div>
                    <div><p className="font-medium text-gray-900">WhatsApp</p><p className="text-xs text-gray-500">+51 999 999 999</p></div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Phone className="h-4 w-4 text-blue-600" /></div>
                    <div><p className="font-medium text-gray-900">Teléfono</p><p className="text-xs text-gray-500">(01) 555-1234</p></div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center"><Clock className="h-4 w-4 text-gray-600" /></div>
                    <div><p className="font-medium text-gray-900">Horario de atención</p><p className="text-xs text-gray-500">Lun — Vie, 9:00 AM — 6:00 PM</p></div>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Recursos de ayuda</h3>
                <div className="space-y-2">
                  <Link href="/ayuda" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 transition-colors text-sm text-gray-600 hover:text-[#8234FE]">
                    <HelpCircle className="h-4 w-4" /> Centro de ayuda
                  </Link>
                  <Link href="/tutoriales" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 transition-colors text-sm text-gray-600 hover:text-[#8234FE]">
                    <Play className="h-4 w-4" /> Tutoriales
                  </Link>
                  <Link href="/faqs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 transition-colors text-sm text-gray-600 hover:text-[#8234FE]">
                    <BookOpen className="h-4 w-4" /> Preguntas frecuentes
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
