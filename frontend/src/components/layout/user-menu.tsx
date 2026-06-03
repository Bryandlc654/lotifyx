"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronDown, Shield } from "lucide-react";
import { logoutUser } from "@/lib/api";

interface UserData {
  email: string;
  phone: string;
  role?: { name: string } | null;
  profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface UserMenuProps {
  user: UserData;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setOpen(false);
    onLogout();
    router.push("/");
  };

  const initials =
    user.profile
      ? `${user.profile.first_name?.[0] || ""}${user.profile.last_name?.[0] || ""}`.toUpperCase()
      : user.email[0].toUpperCase();

  const displayName = user.profile
    ? `${user.profile.first_name} ${user.profile.last_name}`
    : user.email;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8234FE] to-[#26BEFE] flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
          </div>

          {user.role?.name === "superadmin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <Shield className="h-4 w-4" />
              Administración
            </Link>
          )}

          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <User className="h-4 w-4" />
            Mi perfil
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
