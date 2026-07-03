"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getProfile, isAuthenticated, removeTokens, updateProfile, getAccessToken } from "@/lib/api";
import { toast } from "sonner";
import { MessageCircle, Wallet } from "lucide-react";

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", alias: "", password: "", avatar_url: "" });
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then((data) => {
        const u = data.user as any;
        setUserId(u.id);
        setUserRole(u.role?.name || "");
        setForm({
          first_name: u.profile?.first_name || "",
          last_name: u.profile?.last_name || "",
          email: u.email || "",
          phone: u.phone || "",
          alias: u.profile?.profile_alias || "",
          password: "",
          avatar_url: u.profile?.avatar_url || "",
        });
      })
      .catch(() => { removeTokens(); router.push("/"); })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const dto: any = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        profile_alias: form.alias,
      };
      if (form.password) dto.password = form.password;

      const res = await updateProfile(dto);
      const u = res.user || res;
      setForm({
        first_name: u.profile?.first_name || "",
        last_name: u.profile?.last_name || "",
        email: u.email || "",
        phone: u.phone || "",
        alias: u.profile?.profile_alias || "",
        password: "",
        avatar_url: u.profile?.avatar_url || "",
      });
      toast.success("Perfil actualizado");
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    } finally { setSaving(false); }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForm({ ...form, avatar_url: data.url });
      toast.success("Foto actualizada");
    } catch (err: any) {
      toast.error("Error al subir foto");
    } finally { setAvatarUploading(false); }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-32 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-32 min-h-screen bg-slate-100 flex items-start justify-center p-4 gap-12">
        <nav className="w-44 flex-shrink-0 pt-8 space-y-1">
          <button onClick={() => router.push("/perfil")}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 border-l-2 border-slate-700 -ml-px">
            Editar Perfil
          </button>
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/dashboard")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Dashboard
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-compras")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Compras
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mensajes")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mensajes
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-cuentas")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Cuentas
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-ventas")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Ventas
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-fondos")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Fondos
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/carga-masiva")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Carga Masiva
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mis-productos")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Productos
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/ofrecer")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Ofrecer
            </button>
          )}
          {userRole === "vendedor" && (
            <button onClick={() => router.push("/perfil/mi-plan")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mi Plan
            </button>
          )}
          {userRole !== "superadmin" && (
            <button onClick={() => router.push("/perfil/mis-resenas")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Mis Reseñas
            </button>
          )}
        </nav>
        <div className="w-full max-w-2xl bg-[#f8fafc] rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 md:p-12">
              <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-700">Editar Perfil</h1>
              </header>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Profile Picture */}
                <section className="flex items-center space-x-6 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-sky-400 p-1 bg-white">
                      {form.avatar_url ? (
                        <img src={form.avatar_url} alt="Foto" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] flex items-center justify-center text-white text-2xl font-bold">
                          {form.first_name?.[0] || "U"}
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={avatarUploading}
                      className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-lg border-2 border-white shadow-md hover:bg-blue-600 transition-colors disabled:opacity-50">
                      {avatarUploading ? (
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">Foto de perfil</span>
                    <span className="text-xs text-slate-400">JPG, GIF o PNG. Peso máx. de 800 Kb</span>
                  </div>
                </section>

                {/* Form Fields */}
                <div className="space-y-5">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-slate-600" htmlFor="nombres">Nombres</label>
                    <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-slate-300" placeholder="Lucía" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-slate-600" htmlFor="apellidos">Apellidos</label>
                    <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-slate-300" placeholder="García" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-slate-600" htmlFor="email">Correo electrónico</label>
                    <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-slate-300" placeholder="correo@ejemplo.com" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-slate-600" htmlFor="alias">Nombre de perfil o alias</label>
                    <input value={form.alias} onChange={e => setForm({...form, alias: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-slate-300" placeholder="LuciaG_92" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-slate-600" htmlFor="password">Contraseña</label>
                    <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} type="password"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-slate-300" placeholder="Dejar vacío para no cambiar" />
                  </div>
                </div>

                {/* Actions */}
                <footer className="flex flex-row space-x-4 pt-6">
                  <button type="submit" disabled={saving}
                    className="bg-gradient-to-r from-[#8B5CF6] via-[#3B82F6] to-[#0EA5E9] text-white font-semibold py-3 px-8 rounded-xl hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60">
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                  <button type="button" onClick={() => router.push("/")}
                    className="bg-[#64748B] text-white font-semibold py-3 px-8 rounded-xl hover:bg-[#546170] transition-colors shadow-sm">
                    Cancelar
                  </button>
                </footer>
              </form>
            </div>
          </div>
      </main>
    </>
  );
}
