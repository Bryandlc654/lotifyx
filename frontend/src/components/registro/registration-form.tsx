"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { registerUser, verifyEmail } from "@/lib/api";
import {
  registroSchema,
  RegistroFormData,
  COMO_NOS_ENCONTRASTE_OPTIONS,
} from "@/lib/validations";

export function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RegistroFormData>({
    resolver: zodResolver(registroSchema),
    mode: "onChange",
    defaultValues: {
      nombre: "",
      apellidos: "",
      dni: "",
      fechaNacimiento: "",
      telefono: "",
      correo: "",
      contrasena: "",
      confirmarContrasena: "",
      ruc: "",
      razonSocial: "",
      codigoReferidos: "",
      accountType: "",
      comoNosEncontraste: "",
      aceptaTerminos: false as unknown as true,
    },
  });

  const aceptaTerminos = watch("aceptaTerminos");

  const onSubmit = async (data: RegistroFormData) => {
    setIsSubmitting(true);
    try {
      const { confirmarContrasena, ...rest } = data;
      const payload = {
        ...rest,
        aceptaTerminos: Boolean(data.aceptaTerminos),
        accountType: data.accountType,
        codigoReferidos: data.codigoReferidos || undefined,
      };
      await registerUser(payload);
      toast.success("Registro exitoso. Revisa tu correo para el código de verificación.");
      setRegisteredEmail(data.correo);
      reset();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al registrarse";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      await res.json();
      toast.success("Código reenviado. Revisa tu correo.");
    } catch {
      toast.error("Error al reenviar");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Ingresa el código de 6 dígitos");
      return;
    }
    setVerifying(true);
    try {
      const res = await verifyEmail(registeredEmail, verificationCode);
      toast.success("¡Cuenta verificada!");
      setRegisteredEmail("");
      setVerificationCode("");

      // Check account type and redirect
      if (res.user?.profile?.account_type === "Quiero vender" && !res.user?.profile?.plan_id) {
        router.push("/planes");
      } else if (res.accessToken) {
        // Buyers go to login
        router.push("/login");
      } else {
        router.push("/login");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al verificar";
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos personales */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <Input label="Nombre" {...register("nombre")} error={errors.nombre?.message} />
            </div>
            <div className="flex-1 min-w-0">
              <Input label="Apellidos" {...register("apellidos")} error={errors.apellidos?.message} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <Input label="DNI" maxLength={8} inputMode="numeric" {...register("dni")} error={errors.dni?.message} />
            </div>
            <div className="flex-1 min-w-0">
              <Input label="Fecha de nacimiento" type="date" {...register("fechaNacimiento")} error={errors.fechaNacimiento?.message} />
            </div>
          </div>
          <Input label="Teléfono" maxLength={9} inputMode="numeric" {...register("telefono")} error={errors.telefono?.message} />
          <Input label="Correo electrónico" type="email" {...register("correo")} error={errors.correo?.message} />
          <Input label="Contraseña" isPassword {...register("contrasena")} error={errors.contrasena?.message} />
          <Input label="Confirmar contraseña" isPassword {...register("confirmarContrasena")} error={errors.confirmarContrasena?.message} />
          <Select label="¿Qué quieres hacer en Lotifyx?" options={["Quiero vender", "Quiero comprar"]} {...register("accountType")} error={errors.accountType?.message} />
        </section>

        {/* Datos de empresa */}
        <section>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <Input label="RUC" maxLength={11} inputMode="numeric" {...register("ruc")} error={errors.ruc?.message} />
            </div>
            <div className="flex-1 min-w-0">
              <Input label="Razón social (Opcional)" {...register("razonSocial")} error={errors.razonSocial?.message} />
            </div>
          </div>
        </section>

        {/* Información adicional */}
        <section className="space-y-4">
          <Input label="Código de referidos (opcional)" maxLength={20} {...register("codigoReferidos")} error={errors.codigoReferidos?.message} />
          <Select label="¿Cómo nos encontraste?" options={COMO_NOS_ENCONTRASTE_OPTIONS} {...register("comoNosEncontraste")} error={errors.comoNosEncontraste?.message} />
        </section>

        <div>
          <Checkbox
            label={<span>Al crear una cuenta significa que aceptas los{" "}<a href="#" className="text-primary-600 hover:text-primary-700 underline underline-offset-2" onClick={(e) => e.preventDefault()}>Términos y condiciones</a>{" "}y nuestra{" "}<a href="#" className="text-primary-600 hover:text-primary-700 underline underline-offset-2" onClick={(e) => e.preventDefault()}>Política de privacidad</a></span>}
            checked={!!aceptaTerminos}
            {...register("aceptaTerminos")}
            error={errors.aceptaTerminos?.message}
          />
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? "Registrando..." : "Crear cuenta"}
        </Button>

        <div className="space-y-3">
          <button type="button" className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <img src="/google.svg" alt="Google" className="h-5 w-5" />
            Sign up with Google
          </button>
          <button type="button" className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <img src="/facebook.svg" alt="Facebook" className="h-5 w-5" />
            Sign in with Facebook
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">Iniciar sesión</Link>
        </p>
      </form>

      {/* Verification Modal */}
      {registeredEmail && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRegisteredEmail("")} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-green-800">Revisa tu correo</h3>
              <p className="text-sm text-green-600 mt-1">
                Enviamos un código de verificación a{" "}
                <span className="font-medium">{registeredEmail}</span>
              </p>
            </div>

            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-sm font-medium text-gray-700">
                Código de verificación
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-center text-lg tracking-[0.5em] font-mono text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-colors"
              />
            </div>

            <Button
              type="button"
              onClick={handleVerify}
              loading={verifying}
              className="w-full"
            >
              {verifying ? "Verificando..." : "Verificar cuenta"}
            </Button>

            <p className="text-center text-xs text-gray-400 mt-4">
              ¿No recibiste el código?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {resending ? "Reenviando..." : "Reenviar código"}
              </button>
              {" · "}
              <button
                type="button"
                onClick={() => setRegisteredEmail("")}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Volver
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
