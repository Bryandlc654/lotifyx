"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getProfile, isAuthenticated, removeTokens } from "@/lib/api";
import { User, Mail, Phone, Hash, Calendar, Building2 } from "lucide-react";

interface ProfileData {
  id: string;
  email: string;
  phone: string;
  status: string;
  referral_code: string;
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    birth_date: string;
    document_type: string;
    document_number: string;
    ruc: string;
    razon_social: string;
    avatar_url?: string;
  };
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
      return;
    }

    getProfile()
      .then((data) => setProfile(data.user as ProfileData))
      .catch(() => {
        removeTokens();
        router.push("/");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </main>
      </>
    );
  }

  if (!profile) return null;

  const initials =
    profile.profile
      ? `${profile.profile.first_name?.[0] || ""}${profile.profile.last_name?.[0] || ""}`.toUpperCase()
      : profile.email[0].toUpperCase();

  const fullName = profile.profile
    ? `${profile.profile.first_name} ${profile.profile.last_name}`
    : "Usuario";

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gray-50">
        {/* Header del perfil */}
        <div className="bg-gradient-to-br from-[#8234FE] to-[#26BEFE]">
          <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white/20">
                {initials}
              </div>
              <div className="text-center sm:text-left text-white">
                <h1 className="text-2xl sm:text-3xl font-bold">{fullName}</h1>
                <p className="text-white/70 mt-1">{profile.email}</p>
                <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-white/15 text-xs font-medium text-white/90">
                  {profile.status === "active" ? "Activo" : profile.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-4xl mx-auto px-6 -mt-6 pb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-8">
            {/* Datos personales */}
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">
                Datos Personales
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem
                  icon={User}
                  label="Nombre completo"
                  value={fullName}
                />
                <InfoItem
                  icon={Mail}
                  label="Correo electrónico"
                  value={profile.email}
                />
                <InfoItem
                  icon={Phone}
                  label="Teléfono"
                  value={profile.phone || "—"}
                />
                <InfoItem
                  icon={Calendar}
                  label="Fecha de nacimiento"
                  value={profile.profile?.birth_date ? new Date(profile.profile.birth_date).toLocaleDateString("es-PE") : "—"}
                />
                <InfoItem
                  icon={Hash}
                  label="Documento"
                  value={
                    profile.profile?.document_type && profile.profile?.document_number
                      ? `${profile.profile.document_type} ${profile.profile.document_number}`
                      : "—"
                  }
                />
              </div>
            </section>

            {/* Datos de empresa */}
            <section className="pt-6 border-t border-gray-100">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">
                Datos de la Empresa
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem
                  icon={Building2}
                  label="RUC"
                  value={profile.profile?.ruc || "—"}
                />
                <InfoItem
                  icon={Building2}
                  label="Razón social"
                  value={profile.profile?.razon_social || "—"}
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-primary-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
