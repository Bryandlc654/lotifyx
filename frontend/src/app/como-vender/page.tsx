import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChevronDown, UserPlus, Package, Truck, ShieldCheck, ArrowRight, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Regístrate gratis",
    desc: "Crea tu cuenta en minutos. Solo necesitas tu correo y algunos datos básicos. Sin compromisos ni costos ocultos.",
    image: "/como-comprar/C1.png",
    benefits: ["Registro en menos de 2 minutos", "Sin tarjetas de crédito", "Empieza hoy mismo"],
  },
  {
    icon: Package,
    title: "Publica tus productos",
    desc: "Sube fotos, precios y stock fácilmente. Usa nuestra plataforma para llegar a miles de compradores interesados en lo que ofreces.",
    image: "/como-comprar/C2.png",
    benefits: ["Fotos y descripciones ilimitadas", "Carga masiva con Excel", "Categorías inteligentes"],
  },
  {
    icon: Truck,
    title: "Vende y envía",
    desc: "Recibe pedidos y gestiona todo desde tu panel. Coordina el envío con el comprador y da seguimiento a cada venta en tiempo real.",
    image: "/como-comprar/C3.png",
    benefits: ["Panel de ventas en tiempo real", "Notificaciones de nuevos pedidos", "Historial completo"],
  },
  {
    icon: ShieldCheck,
    title: "Cobra seguro",
    desc: "Recibe tu dinero cuando el comprador confirma la recepción. Con nuestro sistema de pagos protegidos, ambas partes están tranquilas.",
    image: "/como-comprar/C4.png",
    benefits: ["Pagos protegidos", "Transferencia directa", "Soporte ante reclamos"],
  },
];

export default function ComoVenderPage() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-[#f5f6f8]">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#8234FE] to-[#26BEFE] text-white">
          <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white blur-3xl" />
            </div>
            <div className="relative">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                Vende fácil, <span className="text-cyan-200">cobra seguro</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8">
                Publica tus productos, llega a nuevos clientes y gestiona tus ventas desde un solo lugar. 
                Recibe pagos seguros y construye tu reputación mientras haces crecer tu negocio.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/registro" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-[#8234FE] hover:bg-gray-100 transition-all shadow-lg">
                  Comenzar ahora <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/categorias" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-all">
                  Ver productos
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Cómo vender en Lotifyx</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Sigue estos simples pasos y empieza a vender hoy mismo</p>
          </div>

          <div className="space-y-20">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-10 lg:gap-16`}>
                  {/* Image */}
                  <div className="w-full lg:w-1/2">
                    <div className="bg-gradient-to-br from-[#8234FE]/5 to-[#26BEFE]/5 rounded-3xl p-6 border border-gray-100">
                      <img src={step.image} alt={step.title} className="w-full h-auto rounded-2xl" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="w-full lg:w-1/2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] text-white text-lg font-bold mb-5">
                      {i + 1}
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="h-6 w-6 text-[#8234FE]" />
                      <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-gray-500 leading-relaxed mb-5">{step.desc}</p>
                    <ul className="space-y-2">
                      {step.benefits.map((b, j) => (
                        <li key={j} className="flex items-center gap-2.5 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-[#8234FE] to-[#26BEFE]">
          <div className="max-w-3xl mx-auto px-6 py-20 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">¿Listo para empezar a vender?</h2>
            <p className="text-lg text-white/80 mb-8">Únete a miles de vendedores que ya confían en Lotifyx</p>
            <Link href="/registro" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-[#8234FE] hover:bg-gray-100 transition-all shadow-lg">
              Crear cuenta gratis <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
