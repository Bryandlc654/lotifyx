"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser,
  getRbacRoles, AdminUser,
} from "@/lib/api";
import { Plus, Pencil, Trash2, X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function GestoresPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);

  const [modal, setModal] = useState<{ open: boolean; user?: AdminUser }>({ open: false });
  const [form, setForm] = useState({
    email: "", password: "", phone: "", role_id: "", status: "active",
    first_name: "", last_name: "", document_type: "", document_number: "",
  });
  const [saving, setSaving] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user?: AdminUser }>({ open: false });

  useEffect(() => {
    load();
    getRbacRoles().then(setRoles).catch(() => {});
  }, []);

  async function load(p?: number) {
    setLoading(true);
    try {
      const res = await getAdminUsers({ is_admin: "true", page: p || page, limit: 10 });
      setUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e: any) { toast.error("Error al cargar gestores"); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setForm({ email: "", password: "", phone: "", role_id: "", status: "active", first_name: "", last_name: "", document_type: "", document_number: "" });
    setModal({ open: true });
  }

  function openEdit(user: AdminUser) {
    setForm({
      email: user.email, password: "", phone: user.phone || "", role_id: user.role_id || "",
      status: user.status, first_name: user.profile?.first_name || "", last_name: user.profile?.last_name || "",
      document_type: user.profile?.document_type || "", document_number: user.profile?.document_number || "",
    });
    setModal({ open: true, user });
  }

  async function handleSave() {
    if (!form.email || !form.first_name) { toast.error("Email y nombre obligatorios"); return; }
    if (!modal.user && !form.password) { toast.error("Contraseña obligatoria"); return; }
    if (!form.role_id) { toast.error("Selecciona un rol"); return; }
    setSaving(true);
    try {
      if (modal.user) {
        const dto: any = { ...form };
        if (!dto.password) delete dto.password;
        await updateAdminUser(modal.user.id, dto);
        toast.success("Gestor actualizado");
      } else {
        await createAdminUser(form);
        toast.success("Gestor creado");
      }
      setModal({ open: false });
      load();
    } catch (e: any) { toast.error(e.message || "Error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteAdminUser(id); toast.success("Eliminado"); setDeleteModal({ open: false }); load(); }
    catch (e: any) { toast.error("Error al eliminar"); }
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestores</h1>
            <p className="text-gray-500 text-sm mt-1">{total} gestores registrados</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
            <Plus className="h-4 w-4" /> Nuevo gestor
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay gestores registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Gestor</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Rol</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Estado</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8234FE] to-[#26BEFE] flex items-center justify-center text-white text-xs font-bold">
                            {u.profile?.first_name?.[0] || u.email[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{u.profile?.first_name} {u.profile?.last_name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                          {u.role?.name || "Sin rol"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>{u.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded text-gray-400 hover:text-primary-500 hover:bg-primary-50"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteModal({ open: true, user: u })} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">Página {page} de {totalPages}</p>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => { setPage(page-1); load(page-1); }}
                  className="p-1.5 rounded text-gray-400 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                <button disabled={page >= totalPages} onClick={() => { setPage(page+1); load(page+1); }}
                  className="p-1.5 rounded text-gray-400 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal({ open: false })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <button onClick={() => setModal({ open: false })}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-5">{modal.user ? "Editar gestor" : "Nuevo gestor"}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email" value={form.email} onChange={v => setForm({...form, email: v})} type="email" />
                <Field label="Contraseña" value={form.password} onChange={v => setForm({...form, password: v})} type="password" placeholder={modal.user ? "••••••••" : ""} />
                <Field label="Nombre" value={form.first_name} onChange={v => setForm({...form, first_name: v})} />
                <Field label="Apellidos" value={form.last_name} onChange={v => setForm({...form, last_name: v})} />
                <Field label="Teléfono" value={form.phone} onChange={v => setForm({...form, phone: v})} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Rol</label>
                  <select value={form.role_id} onChange={e => setForm({...form, role_id: e.target.value})}
                    className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200">
                    <option value="">Seleccionar rol</option>
                    {roles.filter(r => r.name !== "superadmin" && r.name !== "vendedor" && r.name !== "comprador").map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal({ open: false })}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                {saving ? "Guardando..." : modal.user ? "Actualizar" : "Crear gestor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteModal({ open: false })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">¿Eliminar gestor?</h3>
            <p className="text-sm text-gray-500 mt-1">
              Esta acción eliminará permanentemente a{" "}
              <span className="font-medium text-gray-700">
                {deleteModal.user.profile?.first_name} {deleteModal.user.profile?.last_name}
              </span>
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <button onClick={() => setDeleteModal({ open: false })}
                className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => handleDelete(deleteModal.user!.id)}
                className="px-5 py-2 rounded-lg bg-red-500 text-sm font-semibold text-white hover:bg-red-600">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
    </div>
  );
}
