import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function TerminosPage() {
  return (
    <>
      <Header />
      <main className="pt-24 bg-[#f8fafc] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
          <aside className="w-full md:w-64 flex-shrink-0">
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider block mb-2">Enlaces de ayuda</span>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Legal</h1>
            <nav className="space-y-1">
              <p className="text-xs font-bold text-slate-800 mb-3 px-3 uppercase tracking-tight">Contenido</p>
              <a className="block px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg transition-colors">
                Términos y condiciones
              </a>
              <a href="/privacidad" className="block px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Política de privacidad
              </a>
            </nav>
          </aside>
          <main className="flex-1">
            <header className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Términos y condiciones de aliados</h2>
              <p className="text-sm text-slate-500">Se actualizó por última vez el julio 04, 2023.</p>
            </header>
            <section className="mb-10">
              <h3 className="text-lg font-bold text-slate-800 mb-3">1. Información</h3>
              <ul className="list-disc list-outside ml-5 space-y-1 text-sm text-slate-600 leading-relaxed">
                <li>Utilizar la información de BOB con responsabilidad ya que representan a la marca de BOB.</li>
                <li>No se puede utilizar la información para otros fines distintos a la venta.</li>
                <li>Toda la información generada y compartida es propiedad de BOB.</li>
              </ul>
            </section>
            <section className="mb-10">
              <h3 className="text-lg font-bold text-slate-800 mb-3">2. Visitas</h3>
              <ul className="list-disc list-outside ml-5 space-y-1 text-sm text-slate-600 leading-relaxed">
                <li>No se puede organizar visitas sin nuestra coordinación.</li>
                <li>Todas las coordinaciones de las visitas serán coordinadas directamente entre BOB y el Vendedor.</li>
                <li>BOB confirmará la fecha a los aliados para que se les avise a los agentes.</li>
                <li>No es requisito que el aliado esté presente en las visitas.</li>
              </ul>
            </section>
            <section className="mb-10">
              <h3 className="text-lg font-bold text-slate-800 mb-3">3. Comisiones</h3>
              <ul className="list-disc list-outside ml-5 space-y-1 text-sm text-slate-600 leading-relaxed">
                <li>Se generará una comisión del 40% para la primera compra que realice el agente y del 10% hasta la 3ra compra que haga el agente que consiguió el aliado.</li>
                <li>Es indispensable para el pago de la comisión que el agente comprador coloque el código del aliado a la hora de realizar la oferta en la página web. Caso contrario no se podrá asociar el lote vendido con el aliado.</li>
                <li>El pago de las comisiones se realizará el siguiente miércoles posterior al despacho del lote.</li>
              </ul>
            </section>
          </main>
        </div>
      </main>
      <Footer />
    </>
  );
}
