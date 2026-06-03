"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { handleGoogleCallback } from "@/lib/api";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    if (accessToken && refreshToken) {
      handleGoogleCallback(accessToken, refreshToken);
      toast.success("Inicio de sesión con Google exitoso");
    } else {
      toast.error("Error al iniciar sesión con Google");
    }

    router.push("/perfil");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirigiendo...</p>
    </div>
  );
}
