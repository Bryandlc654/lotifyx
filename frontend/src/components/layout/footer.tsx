const footerLinks = [
  {
    title: "Producto",
    links: [
      { label: "Inicio", href: "/" },
      { label: "Subastas", href: "#" },
      { label: "Soluciones", href: "#" },
      { label: "Precios", href: "#" },
    ],
  },
  {
    title: "Compañía",
    links: [
      { label: "Sobre nosotros", href: "/nosotros" },
      { label: "Carreras", href: "#" },
      { label: "Prensa", href: "/prensa" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "Tutoriales", href: "/tutoriales" },
      { label: "Eventos", href: "/eventos" },
    ],
  },
  {
    title: "Categorías",
    links: [
      { label: "Servicios del hogar", href: "#" },
      { label: "Moda y estilo", href: "#" },
      { label: "Sector inmobiliario", href: "#" },
      { label: "Tecnología", href: "#" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "¿Cómo vender?", href: "/como-vender" },
      { label: "Centro de ayuda", href: "/ayuda" },
      { label: "Soporte", href: "/soporte" },
      { label: "Preguntas frecuentes", href: "/faqs" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos", href: "/terminos" },
      { label: "Privacidad", href: "/privacidad" },
      { label: "Cookies", href: "/politica-de-cookies" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[#161A3A] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Links section — 7 columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-8 mb-12">
          {footerLinks.map((section, i) => (
            <div key={i}>
              <h4 className="text-white font-semibold text-sm mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <a href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Columna 7: Imagen reclamaciones */}
          <div>
            <img
              src="/footer/btn_libro_reclamaciones.png"
              alt="Libro de reclamaciones"
              className="h-20 w-auto"
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <img src="/LOGO-LOTIFYX_HORIZONTAL.svg" alt="Lotifyx" className="h-8 w-auto brightness-0 invert opacity-60" />
          <p className="text-gray-500 text-xs text-center">
            Copyright © 2026 Lotifyx. | Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <img src="/facebook.svg" alt="Facebook" className="w-5 h-5 brightness-0 invert opacity-60 hover:opacity-100 transition-opacity" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1.5" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.89a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
