export function FeaturesSection() {
  const features = [
    { img: "/confianza/Vector.svg", text: "Envíos gratis en productos desde S/ 30.000" },
    { img: "/confianza/Vector (1).svg", text: "Garantía garantizada en cada compra" },
    { img: "/confianza/devolucion-de-dinero 1.svg", text: "3% de cashback en Lotifyx" },
    { img: "/confianza/Group.svg", text: "3 cuotas extra sin interés en tus compras" },
  ];

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-[#F4F6F7] rounded-2xl p-8 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <img src={f.img} alt="" className="w-12 h-12 object-contain" />
                </div>
                <p className="text-[#344054] text-base">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
