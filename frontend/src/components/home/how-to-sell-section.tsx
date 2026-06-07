const steps = [
  { num: 1, title: "Regístrate gratis", sub: "Crea tu cuenta en minutos." },
  { num: 2, title: "Publica tus productos", sub: "Sube fotos, precios y stock fácilmente." },
  { num: 3, title: "Vende y envía", sub: "Recibe pedidos y gestiona todo desde tu panel." },
  { num: 4, title: "Cobra seguro", sub: "Recibe tu dinero cuando el comprador confirma." },
];

export function HowToSellSection() {
  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-10 lg:gap-16">
          {/* Right: image */}
          <div className="flex-1 w-full">
            <img
              src="/cierres-confianza/Rectangle 24 (1).png"
              alt="Vende fácil, cobra seguro"
              className="w-full h-auto max-h-[500px] object-cover rounded-2xl"
            />
          </div>

          {/* Left: content */}
          <div className="flex-1">
            <h2 className="text-[32px] font-bold text-gray-900 leading-tight uppercase">
              Vende fácil, cobra seguro
            </h2>
            <p className="text-base text-gray-500 mt-3 leading-relaxed">
              Publica tus productos, llega a nuevos clientes y gestiona tus ventas desde un solo lugar. Recibe pagos seguros y construye tu reputación mientras haces crecer tu negocio.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
              {steps.map((s) => (
                <div key={s.num} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8234FE] to-[#26BEFE] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">{s.num}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
