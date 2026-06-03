"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { loginUser, getGoogleAuthUrl } from "@/lib/api";
import { Input } from "@/components/ui/input";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

interface LoginFormData {
  credential: string;
  contrasena: string;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await loginUser(data);
      toast.success("¡Bienvenido!");
      reset();
      onClose();
      router.push("/perfil");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = getGoogleAuthUrl();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900">Iniciar sesión</h2>
        <p className="text-gray-500 mt-1.5 text-sm">
          Bienvenido nuevamente, por favor ingresa los detalles de tu cuenta.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              placeholder="Correo o celular"
              {...register("credential", { required: "Este campo es obligatorio" })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-colors"
            />
            {errors.credential && (
              <p className="text-xs text-red-500">{errors.credential.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Input
              label="Contraseña"
              isPassword
              {...register("contrasena", { required: "Este campo es obligatorio" })}
              error={errors.contrasena?.message}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">Recuérdame por 30 días</span>
            </label>
          </div>

          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="block text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Recuperar contraseña
          </a>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-6 py-2.5 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-md disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-400">o</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <img src="/google.svg" alt="Google" className="h-5 w-5" />
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
