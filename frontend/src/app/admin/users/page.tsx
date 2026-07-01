"use client";

import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser,
  getAdminRoles, toggleUserActive, AdminUser,
} from "@/lib/api";
import { Search, Plus, Pencil, Trash2, X, Check, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);

  // Search & filters
  const [search, setSearch] = useState("");
  const [debounceSearch, setDebounceSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Create/Edit modal
  const [modal, setModal] = useState<{ open: boolean; user?: AdminUser }>({ open: false });
  const [form, setForm] = useState({
    email: "", password: "", phone: "", role_id: "", status: "active",
    first_name: "", last_name: "", document_type: "", document_number: "",
    ruc: "", razon_social: "", is_verified: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user?: AdminUser }>({ open: false });

  useEffect(() => { load(); getAdminRoles().then(setRoles).catch(() => {}); }, []);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebounceSearch(search), 350);
  }, [search]);
  useEffect(() => { setPage(1); load(); }, [debounceSearch, filterRole, filterStatus]);

  async function load(p?: number) {
    setLoading(true);
    try {
      const res = await getAdminUsers({ search, role: filterRole, status: filterStatus, page: p || page, limit: 10 });
      setUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e: any) { toast.error("Error al cargar usuarios"); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setForm({ email: "", password: "", phone: "", role_id: "", status: "active", first_name: "", last_name: "", document_type: "", document_number: "", ruc: "", razon_social: "", is_verified: true });
    setModal({ open: true });
  }

  function openEdit(user: AdminUser) {
    setForm({
      email: user.email, password: "", phone: user.phone || "", role_id: user.role_id || "",
      status: user.status, first_name: user.profile?.first_name || "", last_name: user.profile?.last_name || "",
      document_type: user.profile?.document_type || "", document_number: user.profile?.document_number || "",
      ruc: user.profile?.ruc || "", razon_social: user.profile?.razon_social || "",
      is_verified: user.is_verified,
    });
    setModal({ open: true, user });
  }

  async function handleSave() {
    if (!form.email || !form.first_name) { toast.error("Email y nombre son obligatorios"); return; }
    if (!modal.user && !form.password) { toast.error("Contraseña obligatoria"); return; }
    setSaving(true);
    try {
      if (modal.user) {
        const dto: any = { ...form };
        if (!dto.password) delete dto.password;
        await updateAdminUser(modal.user.id, dto);
        toast.success("Usuario actualizado");
      } else {
        await createAdminUser(form);
        toast.success("Usuario creado");
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
            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-gray-500 text-sm mt-1">{total} usuarios registrados</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
            <Plus className="h-4 w-4" /> Nuevo usuario
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por email, nombre o documento..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-200">
            <option value="">Todos los roles</option>
            {roles.filter(r => r.name === "vendedor" || r.name === "comprador").map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-200">
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="disabled">Deshabilitado</option>
            <option value="pending_approval">Pendiente</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No se encontraron usuarios</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Usuario</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Documento</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Rol</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Estado</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8234FE] to-[#26BEFE] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.profile?.first_name?.[0] || u.email[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{u.profile?.first_name} {u.profile?.last_name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {u.profile?.document_type ? `${u.profile.document_type} ${u.profile.document_number}` : "—"}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {u.role?.name || "Sin rol"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.status === "active" ? "bg-green-100 text-green-700" :
                          u.status === "disabled" ? "bg-red-100 text-red-700" :
                          u.status === "pending_approval" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {u.status === "pending_approval" ? "Pendiente" : u.status}
                        </span>
                        {!u.is_verified && <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-700">Sin verificar</span>}
                      </td>
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-0.5">
                        <button onClick={async () => { try { await toggleUserActive(u.id); toast.success(u.status === "disabled" ? "Usuario habilitado" : "Usuario deshabilitado"); load(); } catch { toast.error("Error"); } }}
                          className={`p-1.5 rounded ${u.status === "disabled" ? "text-green-500 hover:bg-green-50" : "text-orange-500 hover:bg-orange-50"}`}
                          title={u.status === "disabled" ? "Habilitar" : "Deshabilitar"}>
                          {u.status === "disabled" ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded text-gray-400 hover:text-primary-500 hover:bg-primary-50"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteModal({ open: true, user: u })} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">Página {page} de {totalPages}</p>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => { setPage(page-1); load(page-1); }}
                  className="p-1.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                <button disabled={page >= totalPages} onClick={() => { setPage(page+1); load(page+1); }}
                  className="p-1.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal({ open: false })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <button onClick={() => setModal({ open: false })}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-5">{modal.user ? "Editar usuario" : "Nuevo usuario"}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email" value={form.email} onChange={v => setForm({...form, email: v})} type="email" />
              <Field label="Contraseña" value={form.password} onChange={v => setForm({...form, password: v})} type="password" placeholder={modal.user ? "Dejar vacío para no cambiar" : ""} />
              <Field label="Teléfono" value={form.phone} onChange={v => setForm({...form, phone: v})} />
              <Field label="Nombre" value={form.first_name} onChange={v => setForm({...form, first_name: v})} />
              <Field label="Apellidos" value={form.last_name} onChange={v => setForm({...form, last_name: v})} />
              <Field label="Tipo documento" value={form.document_type} onChange={v => setForm({...form, document_type: v})} placeholder="DNI" />
              <Field label="N° documento" value={form.document_number} onChange={v => setForm({...form, document_number: v})} />
              <Field label="RUC" value={form.ruc} onChange={v => setForm({...form, ruc: v})} />
              <Field label="Razón social" value={form.razon_social} onChange={v => setForm({...form, razon_social: v})} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Rol</label>
                <select value={form.role_id} onChange={e => setForm({...form, role_id: e.target.value})}
                  className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200">
                  <option value="">Sin rol</option>
                  {roles.filter(r => r.name === "vendedor" || r.name === "comprador").map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                  className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200">
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="suspended">Suspendido</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_verified} onChange={e => setForm({...form, is_verified: e.target.checked})}
                  className="rounded border-gray-300 text-primary-600" />
                <span className="text-sm text-gray-700">Verificado</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal({ open: false })}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                {saving ? "Guardando..." : modal.user ? "Actualizar" : "Crear usuario"}
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
            <h3 className="text-lg font-bold text-gray-900">¿Eliminar usuario?</h3>
            <p className="text-sm text-gray-500 mt-1">
              Esta acción eliminará permanentemente a{" "}
              <span className="font-medium text-gray-700">
                {deleteModal.user.profile?.first_name} {deleteModal.user.profile?.last_name}
              </span>
              {" "}({deleteModal.user.email})
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <button onClick={() => setDeleteModal({ open: false })}
                className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteModal.user!.id)}
                className="px-5 py-2 rounded-lg bg-red-500 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
                Eliminar
              </button>
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
