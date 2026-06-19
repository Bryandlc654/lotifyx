"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getFaqsAdmin, createFaq, updateFaq, deleteFaq, Faq, isAuthenticated, getFaqCategoriesAdmin, FaqCategory } from "@/lib/api";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";

export default function FaqsAdminPage() {
  const [items, setItems] = useState<Faq[]>([]);
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: "", question: "", answer: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ category: "", question: "", answer: "", is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!isAuthenticated()) return;
    setLoading(true);
    try {
      const [faqs, cats] = await Promise.all([getFaqsAdmin(), getFaqCategoriesAdmin()]);
      setItems(faqs);
      setCategories(cats);
    }
    catch { toast.error("Error"); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.question) return;
    setSaving(true);
    try { await createFaq(form); toast.success("Creada"); setForm({ category: "", question: "", answer: "" }); load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    try { await updateFaq(id, editForm); toast.success("Actualizada"); setEditingId(null); load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar?")) return;
    try { await deleteFaq(id); toast.success("Eliminada"); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Preguntas Frecuentes</h1>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Nueva FAQ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white">
              <option value="">Selecciona categoría</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <input value={form.question} onChange={e => setForm({ ...form, question: e.target.value })}
              placeholder="Pregunta" className="sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
          </div>
          <textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} rows={3}
            placeholder="Respuesta" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 mb-4" />
          <button onClick={handleCreate} disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
            <Plus className="h-4 w-4" /> Crear FAQ
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">FAQs ({items.length})</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay FAQs</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map(f => (
                <div key={f.id} className="px-6 py-4 hover:bg-gray-50">
                  {editingId === f.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                          className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white">
                          <option value="">Selecciona categoría</option>
                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <input value={editForm.question} onChange={e => setEditForm({ ...editForm, question: e.target.value })}
                          placeholder="Pregunta" className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                      </div>
                      <textarea value={editForm.answer} onChange={e => setEditForm({ ...editForm, answer: e.target.value })} rows={2}
                        className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                            className="rounded border-gray-300 text-primary-600" />
                          <span className="text-xs text-gray-600">Activo</span>
                        </label>
                        <button onClick={() => handleUpdate(f.id)} className="p-1 text-green-600"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary-50 text-primary-700">{f.category}</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">{f.question}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{f.answer}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => { setEditingId(f.id); setEditForm({ category: f.category, question: f.question, answer: f.answer, is_active: f.is_active }); }}
                          className="p-1.5 rounded text-gray-400 hover:text-primary-500 hover:bg-primary-50"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
