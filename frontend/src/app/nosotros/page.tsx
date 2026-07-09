import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChevronDown, ShieldCheck, Users, TrendingUp, HeadphonesIcon, ArrowRight, Store, ShoppingCart, Target, Eye, Heart, Zap, Sparkles } from "lucide-react";

const stats = [
  { label: "Vendedores activos", value: "+500", icon: Store },
  { label: "Productos publicados", value: "+10,000", icon: ShoppingCart },
  { label: "Transacciones seguras", value: "+25,000", icon: ShieldCheck },
  { label: "Usuarios registrados", value: "+8,000", icon: Users },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Seguridad ante todo",
    desc: "Cada transacción está protegida. Liberamos el pago al vendedor solo cuando el comprador confirma la recepción.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Heart,
    title: "Compromiso real",
    desc: "Creemos en el comercio justo y en construir relaciones de confianza entre compradores y vendedores peruanos.",
    gradient: "from-rose-500 to-orange-500",
  },
  {
    icon: Zap,
    title: "Innovación continua",
    desc: "Evolucionamos constantemente para ofrecerte las mejores herramientas: carga masiva, panel de ventas y más.",
    gradient: "from-amber-500 to-yellow-500",
  },
  {
    icon: HeadphonesIcon,
    title: "Soporte humano",
    desc: "Nuestro equipo está aquí para ayudarte. Respondemos tus dudas y resolvemos cualquier inconveniente.",
    gradient: "from-cyan-500 to-blue-500",
  },
];

const steps = [
  { number: "01", title: "Nace la idea", year: "2023", desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
  { number: "02", title: "Lanzamiento oficial", year: "2024", desc: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." },
  { number: "03", title: "Crecimiento acelerado", year: "2025", desc: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur." },
  { number: "04", title: "Consolidación", year: "2026", desc: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." },
];

const team = [
  { name: "Carlos Mendoza", role: "CEO & Fundador", img: "https://ui-avatars.com/api/?name=Carlos+Mendoza&background=8234FE&color=fff&size=128" },
  { name: "María García", role: "CTO", img: "https://ui-avatars.com/api/?name=Maria+Garcia&background=26BEFE&color=fff&size=128" },
  { name: "José López", role: "Head of Product", img: "https://ui-avatars.com/api/?name=Jose+Lopez&background=10B981&color=fff&size=128" },
  { name: "Ana Torres", role: "Community Manager", img: "https://ui-avatars.com/api/?name=Ana+Torres&background=F59E0B&color=fff&size=128" },
];

export default function NosotrosPage() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-[#f5f6f8]">
        {/* ========== HERO ========== */}
        <section className="relative bg-gradient-to-br from-[#8234FE] via-[#6D28D9] to-[#26BEFE] text-white overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-300/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-300/5 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-5xl mx-auto px-6 py-24 sm:py-32 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white/90 text-xs font-semibold mb-6 backdrop-blur-sm border border-white/10">
              <Sparkles className="h-3.5 w-3.5" />
              Conoce nuestra historia
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
              Hacemos que{" "}
              <span className="bg-gradient-to-r from-cyan-200 to-white bg-clip-text text-transparent">vender</span> sea
              <br />simple para todos
            </h1>
            <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
              Somos la plataforma peruana que conecta a compradores y vendedores, facilitando el comercio electrónico 
              de forma segura, rápida y sin complicaciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/registro" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-[#8234FE] hover:bg-gray-100 hover:scale-105 transition-all shadow-xl">
                Comenzar ahora <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/como-vender" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 backdrop-blur-sm px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 hover:scale-105 transition-all">
                ¿Cómo funciona?
              </Link>
            </div>
            <nav className="flex items-center gap-2 text-sm mt-12 justify-center text-white/40">
              <Link href="/" className="hover:text-white/80 transition-colors">Inicio</Link>
              <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
              <span className="text-white/80 font-semibold">Nosotros</span>
            </nav>
          </div>
        </section>

        {/* ========== MISIÓN ========== */}
        <section className="max-w-6xl mx-auto px-6 -mt-12 relative z-10">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 sm:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-4 w-fit">
                  <Target className="h-3.5 w-3.5" /> Nuestra misión
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#161A3A] leading-tight mb-5">
                  Impulsamos tu negocio <br /><span className="text-[#8234FE]">sin complicaciones</span>
                </h2>
                <p className="text-gray-500 leading-relaxed mb-4">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et 
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.
                </p>
                <p className="text-gray-500 leading-relaxed">
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#8234FE]/5 to-[#26BEFE]/5 flex items-center justify-center p-8 sm:p-12">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-[#8234FE]/20 to-[#26BEFE]/20 rounded-3xl blur-xl" />
                  <img src="/como-comprar/C1.png" alt="Lotifyx" className="relative w-full max-w-md h-auto rounded-2xl shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== STATS ========== */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-7 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8234FE]/10 to-[#26BEFE]/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-7 w-7 text-[#8234FE]" />
                  </div>
                  <p className="text-3xl font-bold text-[#161A3A] mb-1">{s.value}</p>
                  <p className="text-sm text-gray-400">{s.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========== VALORES ========== */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-4">
              <Heart className="h-3.5 w-3.5" /> Lo que nos define
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#161A3A] mb-3">Nuestros valores</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Principios que guían cada decisión que tomamos</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-7 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${v.gradient} flex items-center justify-center mb-5 shadow-sm`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#161A3A] mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Eye icon extra */}
          <div className="mt-6 bg-gradient-to-br from-[#8234FE] to-[#26BEFE] rounded-2xl p-8 sm:p-10 text-white text-center">
            <Eye className="h-8 w-8 mx-auto mb-4 opacity-80" />
            <h3 className="text-2xl font-bold mb-2">Nuestra visión</h3>
            <p className="text-white/80 max-w-2xl mx-auto text-sm leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et 
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.
            </p>
          </div>
        </section>

        {/* ========== TIMELINE ========== */}
        <section className="bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-20">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-4">
                <TrendingUp className="h-3.5 w-3.5" /> Nuestra historia
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#161A3A] mb-3">Cómo hemos llegado hasta aquí</h2>
              <p className="text-gray-400 text-lg">Un recorrido por los hitos más importantes de Lotifyx</p>
            </div>

            <div className="relative">
              {/* Línea vertical decorativa */}
              <div className="absolute left-[23px] sm:left-1/2 sm:-translate-x-0.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8234FE] via-[#26BEFE] to-[#8234FE] hidden sm:block" />

              <div className="space-y-12">
                {steps.map((s, i) => (
                  <div key={i} className={`relative flex flex-col sm:flex-row items-start gap-6 sm:gap-10 ${i % 2 === 0 ? "" : "sm:flex-row-reverse"}`}>
                    {/* Círculo en la línea */}
                    <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-[#8234FE] to-[#26BEFE] items-center justify-center text-white text-sm font-bold shadow-lg z-10">
                      {s.number}
                    </div>

                    {/* Contenido */}
                    <div className={`w-full sm:w-[calc(50%-40px)] ${i % 2 === 0 ? "sm:text-right sm:pr-4" : "sm:text-left sm:pl-4"}`}>
                      <div className={`bg-gray-50 rounded-2xl p-6 sm:p-7 border border-gray-100 hover:shadow-md transition-shadow ${i % 2 === 0 ? "sm:mr-4" : "sm:ml-4"}`}>
                        <div className={`flex items-center gap-3 mb-3 ${i % 2 === 0 ? "sm:flex-row-reverse" : ""}`}>
                          <span className="px-3 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 whitespace-nowrap">{s.year}</span>
                          <h3 className="font-bold text-[#161A3A]">{s.title}</h3>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========== TEAM ========== */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-4">
              <Users className="h-3.5 w-3.5" /> El equipo
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#161A3A] mb-3">Las personas detrás de Lotifyx</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Un equipo apasionado por transformar el comercio en Perú</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((m, i) => (
              <div key={i} className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <img src={m.img} alt={m.name} className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300" />
                <h4 className="font-bold text-[#161A3A] text-sm">{m.name}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{m.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========== CTA ========== */}
        <section className="bg-gradient-to-br from-[#8234FE] via-[#6D28D9] to-[#26BEFE] relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-300/5 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-3xl mx-auto px-6 py-24 text-center text-white">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              ¿Listo para <span className="text-cyan-200">formar parte</span> de Lotifyx?
            </h2>
            <p className="text-lg text-white/70 mb-10 max-w-lg mx-auto">
              Únete a miles de vendedores y compradores que ya confían en nosotros.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/registro" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-[#8234FE] hover:bg-gray-100 hover:scale-105 transition-all shadow-xl">
                Crear cuenta gratis <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/categorias" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 backdrop-blur-sm px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 hover:scale-105 transition-all">
                Explorar productos
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
