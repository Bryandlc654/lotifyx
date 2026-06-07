const steps = [
  { num: 1, title: "Busca y elige", sub: "Explora productos por categorías o buscador." },
  { num: 2, title: "Compra segura", sub: "Paga con métodos protegidos. Tu dinero está seguro." },
  { num: 3, title: "Recibe tu pedido", sub: "Sigue el envío hasta tu puerta." },
  { num: 4, title: "Califica", sub: "Valora al vendedor y tu experiencia." },
];

export function HowToBuySection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left: image */}
          <div className="flex-1 w-full">
            <img
              src="/cierres-confianza/Rectangle 24.png"
              alt="Comprar nunca fue tan fácil"
              className="w-full h-auto max-h-[500px] object-cover rounded-2xl"
            />
          </div>

          {/* Right: content */}
          <div className="flex-1">
            <h2 className="text-[32px] font-bold text-gray-900 leading-tight uppercase">
              Comprar nunca fue tan fácil
            </h2>
            <p className="text-base text-gray-500 mt-3 leading-relaxed">
              Explora miles de productos, paga con total confianza y recibe tu pedido en la puerta de tu casa. Tu compra está protegida en todo momento y cuentas con soporte si lo necesitas.
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
