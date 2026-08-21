"use client";

import { useRouter } from "next/navigation";

interface PerfilSidebarProps {
  active: string;
  userRole: string;
}

const NAV_ITEMS = [
  { id: "perfil", href: "/perfil", label: "Editar Perfil", roles: ["all"] },
  { id: "dashboard", href: "/perfil/dashboard", label: "Dashboard", roles: ["vendedor"] },
  { id: "mis-compras", href: "/perfil/mis-compras", label: "Mis Compras", roles: ["all-no-superadmin"] },
  { id: "solicitudes", href: "/perfil/solicitudes", label: "Mis Solicitudes", roles: ["all-no-superadmin"] },
  { id: "ofertas", href: "/perfil/ofertas", label: "Mis Ofertas", roles: ["vendedor"] },
  { id: "mensajes", href: "/perfil/mensajes", label: "Mensajes", roles: ["all-no-superadmin"] },
  { id: "mis-cuentas", href: "/perfil/mis-cuentas", label: "Mis Cuentas", roles: ["all-no-superadmin"] },
  { id: "mis-ventas", href: "/perfil/mis-ventas", label: "Mis Ventas", roles: ["vendedor"] },
  { id: "mis-fondos", href: "/perfil/mis-fondos", label: "Mis Fondos", roles: ["vendedor"] },
  { id: "carga-masiva", href: "/perfil/carga-masiva", label: "Carga Masiva", roles: ["vendedor"] },
  { id: "mis-productos", href: "/perfil/mis-productos", label: "Mis Productos", roles: ["vendedor"] },
  { id: "ofrecer", href: "/perfil/ofrecer", label: "Ofrecer", roles: ["vendedor"] },
  { id: "prestador", href: "/perfil/prestador", label: "Prestador de Servicios", roles: ["vendedor"] },
  { id: "mi-plan", href: "/perfil/mi-plan", label: "Mi Plan", roles: ["vendedor"] },
  { id: "mis-resenas", href: "/perfil/mis-resenas", label: "Mis Reseñas", roles: ["all-no-superadmin"] },
];

function isVisible(item: typeof NAV_ITEMS[0], userRole: string) {
  if (item.roles.includes("all")) return true;
  if (item.roles.includes("all-no-superadmin") && userRole !== "superadmin") return true;
  if (item.roles.includes("vendedor") && userRole === "vendedor") return true;
  return false;
}

export function PerfilSidebar({ active, userRole }: PerfilSidebarProps) {
  const router = useRouter();
  const visibleItems = NAV_ITEMS.filter(item => isVisible(item, userRole));

  return (
    <>
      {/* Mobile: horizontal scrollable nav */}
      <nav className="lg:hidden w-full overflow-x-auto -mx-4 px-4 pb-2 mb-4">
        <div className="flex gap-2 min-w-max">
          {visibleItems.map(item => (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                active === item.id
                  ? "bg-gradient-to-r from-[#8234FE] to-[#26BEFE] text-white"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop: vertical sidebar */}
      <nav className="hidden lg:block w-44 flex-shrink-0 pt-8 space-y-1">
        {visibleItems.map(item => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className={`w-full text-left px-3 py-2 text-sm border-l-2 -ml-px transition-colors ${
              active === item.id
                ? "font-semibold text-slate-700 border-slate-700"
                : "text-slate-400 border-transparent hover:text-slate-600"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}
