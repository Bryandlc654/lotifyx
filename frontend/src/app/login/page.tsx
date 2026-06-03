import Link from "next/link";
import { Home } from "lucide-react";
import { LoginForm } from "@/components/login/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex relative">
      <Link
        href="/"
        className="absolute top-4 left-4 z-10 p-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-gray-500 hover:text-primary-600 transition-all shadow-sm"
      >
        <Home className="h-5 w-5" />
      </Link>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
            <p className="text-gray-500 mt-1.5">
              Bienvenido nuevamente, por favor ingresa los detalles de tu cuenta.
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-xs text-gray-400 mt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="text-primary-600 hover:text-primary-700 font-medium">
              Regístrate ahora
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-[#8234FE] to-[#26BEFE]" />
    </main>
  );
}
