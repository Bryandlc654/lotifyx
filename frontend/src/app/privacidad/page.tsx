import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function PrivacidadPage() {
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
              <a href="/terminos" className="block px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Términos y condiciones
              </a>
              <a className="block px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg transition-colors">
                Política de privacidad
              </a>
            </nav>
          </aside>
          <main className="flex-1">
            <header className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Política de privacidad</h2>
              <p className="text-sm text-slate-500">Esta Política de privacidad se actualizó por última vez el julio 04, 2023.</p>
            </header>

            <p className="text-sm text-slate-600 leading-relaxed mb-8">
              La presente Política de privacidad establece los términos en que K + K MANAGEMENT CONSULTING GROUP S.A.C usa y protege la información que es proporcionada por sus usuarios al momento de utilizar su sitio web.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-8">
              Cuando le pedimos llenar los campos de información personal con la cual usted pueda ser identificado, lo hacemos asegurando que sólo se empleará de acuerdo con los términos de este documento.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-8">
              Sin embargo esta Política de privacidad puede cambiar con el tiempo o ser actualizada por lo que le recomendamos y enfatizamos revisar continuamente esta página para asegurarse que está de acuerdo con dichos cambios.
            </p>

            <section className="mb-10">
              <h3 className="text-lg font-bold text-slate-800 mb-3">1. Información que es recogida</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nuestro sitio web podrá recoger información personal por ejemplo: Nombre, información de contacto como su dirección de correo electrónica e información demográfica. Así mismo cuando sea necesario podrá ser requerida información específica para procesar algún pedido o realizar una entrega o facturación.
              </p>
            </section>

            <section className="mb-10">
              <h3 className="text-lg font-bold text-slate-800 mb-3">2. Uso de la información recogida</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Nuestro sitio web emplea la información con el fin de proporcionar el mejor servicio posible, particularmente para mantener un registro de usuarios, de pedidos en caso que aplique, y mejorar nuestros productos y servicios.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Es posible que sean enviados correos electrónicos periódicamente a través de nuestro sitio con ofertas especiales, nuevos productos y otra información publicitaria que consideremos relevante para usted o que pueda brindarle algún beneficio, estos correos electrónicos serán enviados a la dirección que usted proporcione y podrán ser cancelados en cualquier momento.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Está altamente comprometido para cumplir con el compromiso de mantener su información segura. Usamos los sistemas más avanzados y los actualizamos constantemente para asegurarnos que no exista ningún acceso no autorizado.
              </p>
            </section>

            <section className="mb-10">
              <h3 className="text-lg font-bold text-slate-800 mb-3">3. Enlaces a terceros</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Este sitio web pudiera contener enlaces a otros sitios que pudieran ser de su interés. Una vez que usted de clic en estos enlaces y abandone nuestra página, ya no tenemos control sobre al sitio al que es redirigido y por lo tanto no somos responsables de los términos o privacidad ni de la protección de sus datos en esos otros sitios terceros.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Dichos sitios están sujetos a sus propias políticas de privacidad por lo cual es recomendable que los consulte para confirmar que usted está de acuerdo con estas.
              </p>
            </section>

            <section className="mb-10">
              <h3 className="text-lg font-bold text-slate-800 mb-3">4. Control de su información personal</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                En cualquier momento usted puede restringir la recopilación o el uso de la información personal que es proporcionada a nuestro sitio web. Cada vez que se le solicite rellenar un formulario, como el de alta de usuario, puede marcar o desmarcar la opción de recibir información por correo electrónico.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                En caso de que haya marcado la opción de recibir nuestro boletín o publicidad usted puede cancelarla en cualquier momento.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Esta compañía no venderá, cederá ni distribuirá la información personal que es recopilada sin su consentimiento, salvo que sea requerido por un juez con un orden judicial.
              </p>
            </section>
          </main>
        </div>
      </main>
      <Footer />
    </>
  );
}
