"use client";

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChevronDown, Eye, Heart, Truck, Store, MessageCircle } from "lucide-react";

export default function ProductoDetallePage() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">

          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">Inicio</Link>
            <ChevronDown className="h-3 w-3 text-gray-300 rotate-[-90deg]" />
            <Link href="/productos" className="text-[#8234FE] font-semibold hover:text-[#7428F0] transition-colors">Tecnología y Gadgets</Link>
            <ChevronDown className="h-3 w-3 text-gray-300 rotate-[-90deg]" />
            <span className="text-[#8234FE] font-semibold">Smart TV 55" 4K UHD</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[140px_1fr_400px] gap-6">
            <div className="hidden lg:flex flex-col gap-3">
              {[0, 1, 2].map(i => (
                <div key={i} className={`bg-gray-100 rounded-lg aspect-square flex items-center justify-center cursor-pointer border-2 ${i === 0 ? "border-[#8234FE]" : "border-gray-200 hover:border-gray-400"} transition-colors`}>
                  <span className="text-xs text-gray-400">Img {i + 1}</span>
                </div>
              ))}
            </div>

            <div className="bg-gray-100 rounded-xl aspect-square flex items-center justify-center">
              <span className="text-gray-400 text-lg">Imagen principal</span>
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-500">
                Código: SKU-2024-001
              </span>

              <h1 className="text-2xl font-bold text-gray-900 mt-3">
                Smart TV Samsung 55" 4K UHD Crystal Processor
              </h1>

              <p className="text-sm text-gray-500 mt-1">Marca: <span className="font-medium text-gray-700">Samsung</span></p>

              <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                Smart TV Samsung 55 pulgadas con resolución 4K UHD, procesador Crystal 4K para colores más vivos, 
                compatibilidad con asistentes de voz y sistema operativo Tizen.
              </p>

              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Eye className="h-4 w-4" />
                  <span>1,245 vistas</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Heart className="h-4 w-4" />
                  <span>328 guardados</span>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-400 line-through">S/ 1,599</p>
                <p className="text-3xl font-bold text-gray-900">S/ 1,299</p>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all">
                  <Truck className="h-5 w-5" />
                  Envío a domicilio
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-[#8234FE] px-4 py-3.5 text-sm font-semibold text-[#8234FE] hover:bg-[#8234FE]/5 transition-all">
                  <Store className="h-5 w-5" />
                  Recojo en tienda
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                {["Descripción", "Anexos", "Bases del proceso"].map((tab, i) => (
                  <button key={tab}
                    className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${i === 0 ? "text-[#8234FE] border-b-2 border-[#8234FE]" : "text-gray-400 hover:text-gray-600"}`}>
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Smart TV Samsung 55 pulgadas con resolución 4K UHD, procesador Crystal 4K. Incluye control remoto, cable de alimentación y manual de usuario. Garantía oficial de 12 meses.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2"><span className="text-[#8234FE]">•</span> Resolución 4K UHD (3840 x 2160)</li>
                  <li className="flex gap-2"><span className="text-[#8234FE]">•</span> Procesador Crystal 4K</li>
                  <li className="flex gap-2"><span className="text-[#8234FE]">•</span> HDR10+ y contraste mejorado</li>
                  <li className="flex gap-2"><span className="text-[#8234FE]">•</span> Smart TV con Tizen</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900">Agendar visita</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Las visitas requieren cita previa. Te brindamos la ubicación al agendarla.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button className="px-6 py-2.5 rounded-xl bg-[#F4F6F7] text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors">
                  Agendar cita
                </button>
                <a href="#" className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center hover:bg-[#20bd5a] transition-colors">
                  <MessageCircle className="h-5 w-5 text-white" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all group">
                  <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center mb-3">
                    <span className="text-gray-400 text-xs">Producto {i}</span>
                  </div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Marca</p>
                  <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2 group-hover:text-[#8234FE] transition-colors">
                    Producto relacionado #{i}
                  </h3>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB]">
                    Envío gratis
                  </span>
                  <div className="text-right mt-3">
                    <p className="text-sm text-gray-400 line-through">S/ 1,599</p>
                    <p className="text-base font-bold text-gray-900">S/ 1,299</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
