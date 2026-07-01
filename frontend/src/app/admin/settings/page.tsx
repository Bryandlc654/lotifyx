"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getSettings, updateSettings } from "@/lib/api";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface TopbarMessage {
  text: string;
  link: string;
}

const defaultMessages: TopbarMessage[] = [{ text: "", link: "" }];

function parseMessages(raw: string): TopbarMessage[] {
  try { return JSON.parse(raw); } catch { return defaultMessages; }
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    smtp_host: "",
    smtp_port: "",
    smtp_user: "",
    smtp_pass: "",
    apiperu_token: "",
  });
  const [topbarEnabled, setTopbarEnabled] = useState(true);
  const [topbarInterval, setTopbarInterval] = useState("5000");
  const [topbarFontSize, setTopbarFontSize] = useState("13");
  const [topbarFontFamily, setTopbarFontFamily] = useState("sans-serif");
  const [topbarMessages, setTopbarMessages] = useState<TopbarMessage[]>(defaultMessages);

  useEffect(() => {
    getSettings()
      .then((data) => {
        setForm({
          smtp_host: data.smtp_host || "",
          smtp_port: data.smtp_port || "",
          smtp_user: data.smtp_user || "",
          smtp_pass: data.smtp_pass || "",
          apiperu_token: data.apiperu_token || "",
        });
        setTopbarEnabled(data.topbar_enabled !== "false");
        setTopbarInterval(data.topbar_interval || "5000");
        setTopbarFontSize(data.topbar_font_size || "13");
        setTopbarFontFamily(data.topbar_font_family || "sans-serif");
        setTopbarMessages(parseMessages(data.topbar_messages));
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const updateMessage = useCallback((idx: number, field: keyof TopbarMessage, value: string) => {
    setTopbarMessages(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  }, []);

  const addMessage = useCallback(() => {
    if (topbarMessages.length >= 5) { toast.error("Máximo 5 mensajes"); return; }
    setTopbarMessages(prev => [...prev, { text: "", link: "" }]);
  }, [topbarMessages.length]);

  const removeMessage = useCallback((idx: number) => {
    if (topbarMessages.length <= 1) { toast.error("Debe haber al menos 1 mensaje"); return; }
    setTopbarMessages(prev => prev.filter((_, i) => i !== idx));
  }, [topbarMessages.length]);

  async function handleSave() {
    setSaving(true);
    const validMessages = topbarMessages.filter(m => m.text.trim());
    if (validMessages.length === 0) {
      toast.error("Agrega al menos un mensaje con texto");
      setSaving(false);
      return;
    }
    try {
      await updateSettings({
        ...form,
        topbar_enabled: String(topbarEnabled),
        topbar_interval: topbarInterval,
        topbar_font_size: topbarFontSize,
        topbar_font_family: topbarFontFamily,
        topbar_messages: JSON.stringify(validMessages),
      });
      toast.success("Configuración guardada");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-500 text-sm mt-1">
            Administra las opciones del sitio
          </p>
        </div>

        {/* Top Bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Barra superior (Top Bar)</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={topbarEnabled} onChange={e => setTopbarEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#8234FE] peer-checked:to-[#26BEFE]" />
              <span className="ms-2 text-xs text-gray-500">{topbarEnabled ? "Activo" : "Inactivo"}</span>
            </label>
          </div>

          {/* Messages */}
          <div className="space-y-3 mb-4">
            {topbarMessages.map((msg, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                <div className="flex-1 space-y-2">
                  <input type="text" value={msg.text}
                    onChange={e => updateMessage(i, "text", e.target.value)}
                    placeholder={`Mensaje ${i + 1} — Ej: "Envíos gratis en toda la plataforma"`}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
                  <input type="text" value={msg.link}
                    onChange={e => updateMessage(i, "link", e.target.value)}
                    placeholder="Enlace (opcional) — Ej: /categorias"
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
                </div>
                <button onClick={() => removeMessage(i)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button onClick={addMessage}
            className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium mb-4 transition-colors">
            <Plus className="h-4 w-4" /> Agregar mensaje
          </button>

          {/* Settings row */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Intervalo (ms)</label>
              <input type="number" value={topbarInterval} onChange={e => setTopbarInterval(e.target.value)}
                placeholder="5000" min="1000" step="1000"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Tamaño fuente (px)</label>
              <input type="number" value={topbarFontSize} onChange={e => setTopbarFontSize(e.target.value)}
                placeholder="13" min="10" max="30"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Tipo de fuente</label>
              <select value={topbarFontFamily} onChange={e => setTopbarFontFamily(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500">
                <option value="sans-serif">Sans-serif</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
                <option value="Inter">Inter</option>
                <option value="Poppins">Poppins</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-[#8234FE] to-[#26BEFE] text-center text-white"
            style={{ fontSize: `${topbarFontSize}px`, fontFamily: topbarFontFamily }}>
            {topbarMessages.filter(m => m.text.trim()).map((m, i) => (
              <span key={i}>{m.text}{i < topbarMessages.filter(x => x.text.trim()).length - 1 ? " • " : ""}</span>
            )) || <span className="opacity-60">Vista previa</span>}
          </div>
        </div>

        {/* SMTP */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">SMTP</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Host" value={form.smtp_host} onChange={v => setForm({...form, smtp_host: v})} placeholder="smtp.gmail.com" />
            <Field label="Puerto" value={form.smtp_port} onChange={v => setForm({...form, smtp_port: v})} placeholder="587" />
            <Field label="Usuario" value={form.smtp_user} onChange={v => setForm({...form, smtp_user: v})} placeholder="correo@gmail.com" />
            <Field label="Contraseña" value={form.smtp_pass} onChange={v => setForm({...form, smtp_pass: v})} placeholder="App password" type="password" />
          </div>
        </div>

        {/* API Peru */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">API Peru Dev</h2>
          <Field label="Token" value={form.apiperu_token} onChange={v => setForm({...form, apiperu_token: v})} placeholder="token_apiperu..." type="password" />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-8 py-2.5 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </AdminLayout>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
      />
    </div>
  );
}
