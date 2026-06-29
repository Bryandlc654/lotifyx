"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginUser, getGoogleAuthUrl } from "@/lib/api";
import { Input } from "@/components/ui/input";

interface LoginFormData {
  credential: string;
  contrasena: string;
}

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [sending, setSending] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const res = await loginUser(data);
      toast.success("¡Bienvenido!");
      reset();
      const u = res.user as any;
      if (u?.role?.name === "vendedor" && !u?.profile?.plan_id) {
        router.push("/planes"); return;
      }
      router.push(u?.role?.name === "vendedor" ? "/perfil/dashboard" : "/perfil");
    } catch (err: any) {
      toast.error(err.message || "Error al iniciar sesión");
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = () => { window.location.href = getGoogleAuthUrl(); };

  const handleForgotPassword = async () => {
    if (!forgotEmail) { toast.error("Ingresa tu correo"); return; }
    setSending(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } catch { toast.error("Error al enviar"); }
    finally { setSending(false); }
  };

  if (forgotMode) {
    return (
      <div className="space-y-4">
        {forgotSent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">Revisa tu correo para restablecer tu contraseña.</p>
            <button onClick={() => { setForgotMode(false); setForgotSent(false); }}
              className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Ingresa tu correo y te enviaremos un enlace.</p>
            <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
            <button onClick={handleForgotPassword} disabled={sending}
              className="w-full rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
              {sending ? "Enviando..." : "Enviar enlace"}
            </button>
            <button onClick={() => setForgotMode(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700">
              Volver al inicio de sesión
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <input type="text" placeholder="Correo o celular"
            {...register("credential", { required: "Este campo es obligatorio" })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-colors" />
          {errors.credential && <p className="text-xs text-red-500">{errors.credential.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input label="Contraseña" isPassword {...register("contrasena", { required: "Este campo es obligatorio" })} error={errors.contrasena?.message} />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-gray-600">Recuérdame por 30 días</span>
          </label>
        </div>

        <a href="#" onClick={e => { e.preventDefault(); setForgotMode(true); }}
          className="block text-sm text-primary-600 hover:text-primary-700 font-medium">
          Recuperar contraseña
        </a>

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-6 py-2.5 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-md disabled:opacity-60">
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400">o</span></div>
      </div>

      <button type="button" onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
        <img src="/google.svg" alt="Google" className="h-5 w-5" />
        Continuar con Google
      </button>
    </div>
  );
}
