"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getSettings, updateSettings } from "@/lib/api";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    smtp_host: "",
    smtp_port: "",
    smtp_user: "",
    smtp_pass: "",
    topbar_text: "",
  });

  useEffect(() => {
    getSettings()
      .then((data) => setForm({
        smtp_host: data.smtp_host || "",
        smtp_port: data.smtp_port || "",
        smtp_user: data.smtp_user || "",
        smtp_pass: data.smtp_pass || "",
        topbar_text: data.topbar_text || "",
      }))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success("Configuración SMTP actualizada");
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
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Top Bar</h2>
          <Field label="Texto de la barra superior" value={form.topbar_text} onChange={v => setForm({...form, topbar_text: v})}
            placeholder="Vende y recibe tus depósitos en 24hr..." />
        </div>

        {/* SMTP */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">SMTP</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Field label="Host" value={form.smtp_host} onChange={v => setForm({...form, smtp_host: v})} placeholder="smtp.gmail.com" />
            <Field label="Puerto" value={form.smtp_port} onChange={v => setForm({...form, smtp_port: v})} placeholder="587" />
            <Field label="Usuario" value={form.smtp_user} onChange={v => setForm({...form, smtp_user: v})} placeholder="correo@gmail.com" />
            <Field label="Contraseña" value={form.smtp_pass} onChange={v => setForm({...form, smtp_pass: v})} placeholder="App password" type="password" />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-8 py-2.5 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", className = "" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; className?: string;
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
