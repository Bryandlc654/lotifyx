import Link from "next/link";
import { Home } from "lucide-react";
import { RegistrationForm } from "@/components/registro/registration-form";

export default function RegistroPage() {
  return (
    <main className="min-h-screen flex relative">
      {/* Botón home */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-10 p-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-gray-500 hover:text-primary-600 transition-all shadow-sm"
      >
        <Home className="h-5 w-5" />
      </Link>

      {/* Columna izquierda - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Regístrate ahora</h1>
            <p className="text-gray-500 mt-1.5">
              Ingresa tus datos para el registro de tu cuenta.
            </p>
          </div>

          <RegistrationForm />
        </div>
      </div>

      {/* Columna derecha - Gradiente */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-[#8234FE] to-[#26BEFE]" />
    </main>
  );
}
