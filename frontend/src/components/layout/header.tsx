"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react";
import { UserMenu } from "./user-menu";
import { getProfile, isAuthenticated, removeTokens } from "@/lib/api";

interface UserData {
  email: string;
  phone: string;
  profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/registro", label: "Registro" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null);
      setAuthChecked(true);
      return;
    }
    try {
      const data = await getProfile();
      setUser(data.user as UserData);
    } catch {
      removeTokens();
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#8234FE] to-[#26BEFE]">
        <p className="text-center text-xs sm:text-sm font-medium text-white py-2 px-4">
          Vende y recibe tus depósitos en 24hr con la comisión más baja del mercado.
        </p>
      </div>

      {/* Header */}
      <header className="fixed top-9 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src="/LOGO-LOTIFYX_HORIZONTAL.svg"
              alt="Lotifyx"
              className="h-9 w-auto"
            />
          </Link>

          <div className="hidden md:block relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar"
              className="w-40 lg:w-56 pl-10 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-colors"
            />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {!authChecked ? (
              <div className="w-20 h-9 rounded-lg bg-gray-100 animate-pulse" />
            ) : user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all shadow-sm"
              >
                Ingresar
              </Link>
            )}
          </nav>

          <button
            type="button"
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-1"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/perfil"
                  className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-1"
                  onClick={() => setMobileOpen(false)}
                >
                  Mi perfil
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="block text-sm font-medium text-red-600 py-1"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white hover:from-[#7428F0] hover:to-[#1EA8E8] transition-all"
              >
                Ingresar
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
}
