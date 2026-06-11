"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  getRbacRoles, createRbacRole, deleteRbacRole, getPermissions,
  assignPermission, revokePermission, seedPermissions,
  RoleWithPerms, Permission,
} from "@/lib/api";
import { Plus, Trash2, Shield, Check } from "lucide-react";
import { toast } from "sonner";

export default function RbacPage() {
  const [roles, setRoles] = useState<RoleWithPerms[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRoleName, setNewRoleName] = useState("");

  useEffect(() => {
    Promise.all([getRbacRoles(), getPermissions()])
      .then(([r, p]) => { setRoles(r); setPerms(p); })
      .catch(e => toast.error("Error al cargar"))
      .finally(() => setLoading(false));
  }, []);

  const selected = roles.find(r => r.id === selectedRole);
  const selectedPermIds = new Set(selected?.rolePermissions.map(rp => rp.permission_id));

  async function handleCreateRole() {
    if (!newRoleName.trim()) return;
    try { await createRbacRole({ name: newRoleName.trim() }); toast.success("Rol creado"); setNewRoleName(""); refresh(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function handleDeleteRole(id: string) {
    if (!confirm("¿Eliminar este rol?")) return;
    try { await deleteRbacRole(id); toast.success("Eliminado"); setSelectedRole(null); refresh(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function togglePerm(permId: string) {
    if (!selectedRole) return;
    try {
      const existing = selected?.rolePermissions.find(rp => rp.permission_id === permId);
      if (existing) {
        await revokePermission(existing.id);
      } else {
        await assignPermission(selectedRole, permId);
      }
      refresh();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleSeed() {
    try { await seedPermissions(); toast.success("Permisos inicializados"); refresh(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function refresh() {
    const [r, p] = await Promise.all([getRbacRoles(), getPermissions()]);
    setRoles(r); setPerms(p);
  }

  // Group permissions by module
  const grouped = perms.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles y Permisos</h1>
            <p className="text-gray-500 text-sm mt-1">RBAC</p>
          </div>
          <button onClick={handleSeed}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Inicializar permisos
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
        ) : (
          <div className="flex gap-6 flex-col lg:flex-row">
            {/* Roles list */}
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Roles</h3>
                <div className="space-y-1 mb-3">
                  {roles.map(r => (
                    <button key={r.id}
                      onClick={() => setSelectedRole(r.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                        selectedRole === r.id ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50"
                      }`}>
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {r.name}
                      </span>
                      {r.name !== "superadmin" && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(r.id); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Nuevo rol"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                  <button onClick={handleCreateRole}
                    className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="flex-1">
              {selected ? (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                    Permisos de: {selected.name}
                  </h3>
                  <div className="space-y-6">
                    {Object.entries(grouped).map(([module, modulePerms]) => (
                      <div key={module}>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">{module}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {modulePerms.map(p => {
                            const active = selectedPermIds.has(p.id);
                            return (
                              <button key={p.id}
                                onClick={() => togglePerm(p.id)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                                  active ? "bg-primary-50 text-primary-700 border border-primary-200" : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
                                }`}>
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                  active ? "bg-primary-600 border-primary-600" : "border-gray-300"
                                }`}>
                                  {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                                </div>
                                <div>
                                  <p className="font-medium">{p.name}</p>
                                  <p className="text-xs opacity-70">{p.description}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
                  Selecciona un rol para gestionar sus permisos
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
