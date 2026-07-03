"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getProfile, isAuthenticated, removeTokens, logoutUser } from "@/lib/api";
import { LayoutDashboard, Image, LogOut, ChevronLeft, Menu, X, Star, Settings, MessageSquare, Users, FolderTree, PanelTop, ShieldCheck, CreditCard, Shield, UserCog, HelpCircle, Mail, Tags, List, Package, ShoppingCart, FileText, AlertTriangle, Play, Calendar, Newspaper } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const modules = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, permission: null },
  { href: "/admin/gestores", label: "Gestores", icon: UserCog, permission: "users" },
  { href: "/admin/users", label: "Usuarios", icon: Users, permission: "users" },
  { href: "/admin/categories", label: "Categorías", icon: FolderTree, permission: "categories" },
  { href: "/admin/category-fields", label: "Campos", icon: List, permission: "category_fields" },
  { href: "/admin/banners", label: "Banners", icon: Image, permission: "banners" },
  { href: "/admin/secondary-banners", label: "Banners Promo", icon: PanelTop, permission: "secondary_banners" },
  { href: "/admin/backing", label: "Respaldo", icon: ShieldCheck, permission: "backing" },
  { href: "/admin/products", label: "Productos", icon: Package, permission: "products" },
  { href: "/admin/sales", label: "Ventas", icon: ShoppingCart, permission: "orders" },
  { href: "/admin/reclamos", label: "Reclamos", icon: AlertTriangle, permission: "orders" },
  { href: "/admin/plans", label: "Planes", icon: CreditCard, permission: "plans" },
  { href: "/admin/rbac", label: "RBAC", icon: Shield, permission: "rbac" },
  { href: "/admin/marquees", label: "Logos", icon: Star, permission: "marquees" },
  { href: "/admin/testimonials", label: "Testimonios", icon: MessageSquare, permission: "testimonials" },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle, permission: "faqs" },
  { href: "/admin/faq-categories", label: "Categorías FAQ", icon: Tags, permission: "faq_categories" },
  { href: "/admin/blog", label: "Blog", icon: FileText, permission: "blog" },
  { href: "/admin/tutoriales", label: "Tutoriales", icon: Play, permission: "tutorials" },
  { href: "/admin/eventos", label: "Eventos", icon: Calendar, permission: "events" },
  { href: "/admin/prensa", label: "Prensa", icon: Newspaper, permission: "press" },
  { href: "/admin/ayuda", label: "Centro de Ayuda", icon: HelpCircle, permission: "help" },
  { href: "/admin/soporte", label: "Soporte", icon: MessageSquare, permission: "support" },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail, permission: "newsletter" },
  { href: "/admin/leads", label: "Leads", icon: Mail, permission: "leads" },
  { href: "/admin/audit", label: "Auditoría", icon: FileText, permission: "orders" },
  { href: "/admin/settings", label: "Configuración", icon: Settings, permission: "settings" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userPerms, setUserPerms] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    getProfile()
      .then((data) => {
        const u = data.user as any;
        const isAdmin = u?.role?.is_admin || u?.role?.name === "superadmin";
        if (!isAdmin) { router.push("/perfil"); return; }

        // Extract permission names from role
        const perms = (u?.role?.rolePermissions || [])
          .filter((rp: any) => rp.permission)
          .map((rp: any) => rp.permission.name);
        const modulePerms = Array.from(new Set(perms.map((p: string) => p.split(".")[0])));

        setUser(u);
        setUserPerms(modulePerms as string[]);
      })
      .catch(() => { removeTokens(); router.push("/login"); });
  }, [router]);

  // Filter modules by permissions (superadmin sees all)
  // Superadmin sees all modules; other roles see only their permitted modules
  const isSuperadmin = user?.role?.name === "superadmin";
  const visibleModules = modules.filter(m => !m.permission || isSuperadmin || userPerms.includes(m.permission));

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    router.push("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen
        bg-white border-r border-gray-100 flex flex-col
        transition-all duration-300
        ${collapsed ? "w-[68px]" : "w-64"}
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-50 flex-shrink-0">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] flex items-center justify-center text-white text-xs font-bold">
                L
              </div>
              <span className="font-bold text-gray-900 text-sm">Lotifyx</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleModules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${isActive(mod.href, (mod as any).exact)
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <mod.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{mod.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-gray-50 p-3 flex-shrink-0">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8234FE] to-[#26BEFE] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.profile?.first_name?.[0] || "A"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.profile?.first_name || "Admin"}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`
              mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors
              ${collapsed ? "justify-center w-full" : "px-3 py-1.5"}
            `}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Cerrar sesión"}
          </button>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-white shadow border border-gray-200 text-gray-600"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
