"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import Link from "next/link";
import { Image, Package } from "lucide-react";

export default function AdminPage() {
  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-500 text-sm mt-1 mb-8">
          Gestiona los módulos del sistema
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/products"
            className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md hover:border-primary-100 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Productos</h3>
            <p className="text-sm text-gray-500 mt-1">Gestiona y aprueba productos publicados por vendedores</p>
          </Link>
          <Link href="/admin/banners"
            className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md hover:border-primary-100 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
              <Image className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Banners</h3>
            <p className="text-sm text-gray-500 mt-1">Gestiona los banners publicitarios del sitio</p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
