"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAuditLogs } from "@/lib/api";
import { Search, Calendar, User, FileText, Package, ShoppingCart, Clock } from "lucide-react";
import { toast } from "sonner";

interface AuditEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id: string;
  details: any;
  created_at: string;
}

const actionLabels: Record<string, string> = {
  product_created: "Producto creado",
  product_approved: "Producto aprobado",
  product_rejected: "Producto rechazado",
  order_created: "Pedido creado",
  order_approved: "Pago aprobado",
  order_rejected: "Pago rechazado",
  order_status_updated: "Estado actualizado",
  user_created: "Usuario creado",
  user_updated: "Usuario editado",
  user_status_changed: "Estado cambiado",
  user_deleted: "Usuario eliminado",
};

const actionIcons: Record<string, any> = {
  product: Package,
  order: ShoppingCart,
};

const actionColor: Record<string, string> = {
  product_created: "bg-blue-50 text-blue-700",
  product_approved: "bg-green-50 text-green-700",
  product_rejected: "bg-red-50 text-red-700",
  order_created: "bg-purple-50 text-purple-700",
  order_approved: "bg-green-50 text-green-700",
  order_rejected: "bg-red-50 text-red-700",
  order_status_updated: "bg-yellow-50 text-yellow-700",
  user_created: "bg-indigo-50 text-indigo-700",
  user_updated: "bg-blue-50 text-blue-700",
  user_status_changed: "bg-orange-50 text-orange-700",
  user_deleted: "bg-red-50 text-red-700",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  useEffect(() => { load(); }, [actionFilter, entityFilter]);

  async function load() {
    setLoading(true);
    try {
      setLogs(await getAuditLogs({
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
      }));
    } catch {
      toast.error("Error al cargar auditoría");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
          <span className="text-sm text-gray-400">{logs.length} registros</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200">
            <option value="">Todas las acciones</option>
            <option value="product_created">Producto creado</option>
            <option value="product_approved">Producto aprobado</option>
            <option value="product_rejected">Producto rechazado</option>
            <option value="order_created">Pedido creado</option>
            <option value="order_approved">Pago aprobado</option>
            <option value="order_rejected">Pago rechazado</option>
            <option value="order_status_updated">Estado actualizado</option>
            <option value="user_created">Usuario creado</option>
            <option value="user_updated">Usuario editado</option>
            <option value="user_status_changed">Estado cambiado</option>
            <option value="user_deleted">Usuario eliminado</option>
          </select>
          <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200">
            <option value="">Todas las entidades</option>
            <option value="product">Productos</option>
            <option value="order">Pedidos</option>
            <option value="user">Usuarios</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No hay registros de auditoría</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-40">Fecha</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acción</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Entidad</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Usuario</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden xl:table-cell">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${actionColor[log.action] || "bg-gray-100 text-gray-600"}`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-500 capitalize">{log.entity}</span>
                      {log.entity_id && <span className="text-[10px] text-gray-400 font-mono ml-2">{log.entity_id.slice(0, 8)}...</span>}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      {log.user_name ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <User className="w-3 h-3 text-gray-400" />
                          {log.user_name}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sistema</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden xl:table-cell">
                      <span className="text-xs text-gray-500">{JSON.stringify(log.details)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
