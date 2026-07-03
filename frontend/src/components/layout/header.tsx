"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Menu, X, Search, Loader2, Tag } from "lucide-react";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { getProfile, isAuthenticated, removeTokens, getActiveProducts, getImageUrl } from "@/lib/api";
import type { Product } from "@/lib/api";

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
  { href: "/categorias", label: "Categorías" },
  { href: "/contacto", label: "Contacto" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [user, setUser] = useState<UserData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [topBarMessages, setTopBarMessages] = useState<{ text: string; link: string }[]>([]);
  const [topBarEnabled, setTopBarEnabled] = useState(true);
  const [topBarInterval, setTopBarInterval] = useState(5000);
  const [topBarFontSize, setTopBarFontSize] = useState("13");
  const [topBarFontFamily, setTopBarFontFamily] = useState("sans-serif");
  const [topBarIndex, setTopBarIndex] = useState(0);

  useEffect(() => {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api";
    fetch(`${apiUrl}/settings/topbar`)
      .then(r => r.json())
      .then(d => {
        setTopBarEnabled(d.topbar_enabled !== "false");
        setTopBarInterval(parseInt(d.topbar_interval) || 5000);
        setTopBarFontSize(d.topbar_font_size || "13");
        setTopBarFontFamily(d.topbar_font_family || "sans-serif");
        let msgs: { text: string; link: string }[] = [];
        try { msgs = JSON.parse(d.topbar_messages || "[]"); } catch {}
        // Backward compatibility: migrate old topbar_text
        if (msgs.length === 0 && d.topbar_text) {
          msgs = [{ text: d.topbar_text, link: "" }];
        }
        setTopBarMessages(msgs);
      })
      .catch(() => {});
  }, []);

  // Rotate topbar messages
  useEffect(() => {
    if (topBarMessages.length <= 1) return;
    const timer = setInterval(() => {
      setTopBarIndex(i => (i + 1) % topBarMessages.length);
    }, topBarInterval);
    return () => clearInterval(timer);
  }, [topBarMessages, topBarInterval]);

  const currentMessage = topBarMessages[topBarIndex] || null;

  // Autocomplete search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchTerm.trim().length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getActiveProducts(undefined, searchTerm.trim(), 5);
        setSearchResults(res);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll to hide top bar — removed, now always visible

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
      {topBarEnabled && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#8234FE] to-[#26BEFE]">
          {currentMessage ? (
            currentMessage.link ? (
              <a href={currentMessage.link} className="block text-center font-medium text-white py-2 px-4 hover:underline"
                style={{ fontSize: `${topBarFontSize}px`, fontFamily: topBarFontFamily }}>
                {currentMessage.text}
              </a>
            ) : (
              <p className="text-center font-medium text-white py-2 px-4"
                style={{ fontSize: `${topBarFontSize}px`, fontFamily: topBarFontFamily }}>
                {currentMessage.text}
              </p>
            )
          ) : (
            <p className="text-center font-medium text-white py-2 px-4 text-sm">
              Vende y recibe tus depósitos en 24hr con la comisión más baja del mercado.
            </p>
          )}
        </div>
      )}

      {/* Header */}
      <header className="fixed left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300 top-9">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src="/LOGO-LOTIFYX_HORIZONTAL.svg"
              alt="Lotifyx"
              className="h-9 w-auto"
            />
          </Link>

          <div ref={searchRef} className="hidden md:block relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setSelectedIdx(-1); }}
              onKeyDown={e => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedIdx(i => Math.min(i + 1, searchResults.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedIdx(i => Math.max(i - 1, -1));
                } else if (e.key === "Enter") {
                  if (selectedIdx >= 0 && searchResults[selectedIdx]) {
                    window.location.href = `/producto/${searchResults[selectedIdx].id}`;
                  } else if (searchTerm.trim()) {
                    window.location.href = `/categorias?q=${encodeURIComponent(searchTerm.trim())}`;
                  }
                } else if (e.key === "Escape") {
                  setShowDropdown(false);
                }
              }}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              className="w-52 lg:w-80 pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-colors"
            />

            {/* Search dropdown */}
            {(showDropdown || searchLoading) && searchTerm.trim().length >= 3 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-400">No se encontraron productos</div>
                ) : (
                  <ul>
                    {searchResults.map((p, i) => {
                      const img = Object.values(p.specifications || {}).find(v =>
                        typeof v === "string" && v.startsWith("/uploads/") && !v.startsWith("[")
                      ) as string | undefined;
                      const precio = Object.entries(p.specifications || {}).find(([k]) => /precio/i.test(k));
                      return (
                        <li key={p.id}>
                          <Link
                            href={`/producto/${p.id}`}
                            onClick={() => setShowDropdown(false)}
                            className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${i === selectedIdx ? "bg-purple-50" : "hover:bg-gray-50"}`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                              {img ? (
                                <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Tag className="w-4 h-4 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 font-medium truncate">{p.title}</p>
                              {precio && <p className="text-gray-500 text-xs">S/ {parseFloat(String(precio[1])).toLocaleString("en-US")}</p>}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                    <li className="border-t border-gray-100">
                      <Link
                        href={`/categorias?q=${encodeURIComponent(searchTerm.trim())}`}
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2.5 text-sm text-center text-purple-600 hover:bg-purple-50 font-medium"
                      >
                        Ver todos los resultados
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
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
              <>
                <NotificationBell />
                <UserMenu user={user} onLogout={handleLogout} />
              </>
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
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && searchTerm.trim()) {
                    setMobileOpen(false);
                    window.location.href = `/categorias?q=${encodeURIComponent(searchTerm.trim())}`;
                  }
                }}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
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
