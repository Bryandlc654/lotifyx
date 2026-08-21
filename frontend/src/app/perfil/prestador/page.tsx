"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PerfilSidebar } from "@/components/layout/perfil-sidebar";
import { getMyProvider, setProviderZonas, setProviderDisponibilidad, addServiceJob, deleteServiceJob, getProviderPublic, isAuthenticated, removeTokens, getProfile, uploadImage, getImageUrl } from "@/lib/api";
import { toast } from "sonner";
import { MapPin, Clock, Briefcase, Plus, Trash2, Loader2 } from "lucide-react";

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

export default function PrestadorPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [zonas, setZonas] = useState<string[]>([]);
  const [zonaInput, setZonaInput] = useState("");
  const [disponibilidad, setDisponibilidad] = useState<Record<string, string>>({});
  const [portafolio, setPortafolio] = useState<any[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobFotos, setJobFotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile().then((data) => setUserRole(((data as any).user as any)?.role?.name || "")).catch(() => { removeTokens(); router.push("/"); });
    loadProvider();
  }, [router]);

  async function loadProvider() {
    try {
      const p = await getMyProvider();
      if (p) {
        setZonas(Array.isArray(p.zonas_atencion) ? p.zonas_atencion : []);
        setDisponibilidad(p.disponibilidad || {});
        // portafolio via public profile
        const pub = await getProviderPublic((p as any).user_id);
        if (pub?.portafolio) setPortafolio(pub.portafolio);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function saveZonas() {
    setSaving(true);
    try { await setProviderZonas(zonas); toast.success("Zonas de atención guardadas"); }
    catch (e: any) { toast.error(e.message || "Error"); }
    finally { setSaving(false); }
  }

  async function saveDisponibilidad() {
    setSaving(true);
    try { await setProviderDisponibilidad(disponibilidad); toast.success("Disponibilidad horaria guardada"); }
    catch (e: any) { toast.error(e.message || "Error"); }
    finally { setSaving(false); }
  }

  async function addJob() {
    if (!jobTitle.trim()) { toast.error("Indica el título del trabajo"); return; }
    setSaving(true);
    try {
      await addServiceJob({ title: jobTitle, descripcion: jobDesc, fotos: jobFotos });
      toast.success("Trabajo agregado al portafolio");
      setJobTitle(""); setJobDesc(""); setJobFotos([]);
      loadProvider();
    } catch (e: any) { toast.error(e.message || "Error"); }
    finally { setSaving(false); }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 md:px-8 pt-24 md:pt-40 pb-8 flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-12">
        <PerfilSidebar active="prestador" userRole={userRole} />
        <div className="max-w-4xl w-full space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Mi perfil de prestador de servicios</h1>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
          ) : (
            <>
              {/* Zonas de atención */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-3"><MapPin className="h-5 w-5 text-purple-600" /> Zonas de atención geográficas</h2>
                <p className="text-xs text-gray-400 mb-3">Define las zonas (distritos/ciudades) donde ofreces tu servicio.</p>
                <div className="flex gap-2 mb-2">
                  <input value={zonaInput} onChange={e => setZonaInput(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Ej. Miraflores" />
                  <button onClick={() => { if (zonaInput.trim() && !zonas.includes(zonaInput.trim())) { setZonas([...zonas, zonaInput.trim()]); setZonaInput(""); } }}
                    className="px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"><Plus className="h-4 w-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {zonas.map((z, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">
                      {z}
                      <button onClick={() => setZonas(zonas.filter((_, j) => j !== i))} className="text-purple-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <button onClick={saveZonas} disabled={saving} className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white text-sm font-semibold disabled:opacity-50">Guardar zonas</button>
              </section>

              {/* Disponibilidad horaria */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-3"><Clock className="h-5 w-5 text-purple-600" /> Disponibilidad horaria</h2>
                <p className="text-xs text-gray-400 mb-3">Indica el horario por día (ej. 09:00-13:00,15:00-18:00; vacío = no atiende).</p>
                <div className="space-y-2">
                  {DIAS.map(dia => (
                    <div key={dia} className="flex items-center gap-3">
                      <span className="w-28 text-sm font-medium text-gray-600 capitalize">{dia}</span>
                      <input value={disponibilidad[dia] || ""} onChange={e => setDisponibilidad({ ...disponibilidad, [dia]: e.target.value })}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="09:00-13:00,15:00-18:00" />
                    </div>
                  ))}
                </div>
                <button onClick={saveDisponibilidad} disabled={saving} className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white text-sm font-semibold disabled:opacity-50">Guardar disponibilidad</button>
              </section>

              {/* Portafolio */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-3"><Briefcase className="h-5 w-5 text-purple-600" /> Portafolio de trabajos completados</h2>
                <div className="space-y-3 mb-4">
                  {portafolio.map(job => (
                    <div key={job.id} className="border border-gray-100 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">{job.title}</p>
                        <button onClick={async () => { await deleteServiceJob(job.id); loadProvider(); }} className="text-red-500 hover:underline text-xs">Eliminar</button>
                      </div>
                      {job.descripcion && <p className="text-xs text-gray-500 mt-1">{job.descripcion}</p>}
                      {job.fotos?.length > 0 && (
                        <div className="flex gap-2 mt-2">{job.fotos.map((f: string, i: number) => <img key={i} src={getImageUrl(f)} alt="" className="w-16 h-16 rounded-lg object-cover border" />)}</div>
                      )}
                    </div>
                  ))}
                  {portafolio.length === 0 && <p className="text-sm text-gray-400">Aún no tienes trabajos en tu portafolio.</p>}
                </div>
                <div className="space-y-2">
                  <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Título del trabajo (ej. Instalación eléctrica)" />
                  <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Descripción" />
                  <div className="flex gap-2 items-center">
                    <button type="button" onClick={async () => {
                      const input = document.createElement("input");
                      input.type = "file"; input.accept = "image/*"; input.multiple = true;
                      input.onchange = async (e: any) => {
                        const files = e.target.files; if (!files?.length) return;
                        for (const f of files) { try { const url = await uploadImage(f); setJobFotos(prev => [...prev, url]); } catch {} }
                      };
                      input.click();
                    }} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold">+ Fotos</button>
                    {jobFotos.map((f, i) => <img key={i} src={getImageUrl(f)} alt="" className="w-14 h-14 rounded-lg object-cover border" />)}
                    <button onClick={addJob} disabled={saving} className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white text-sm font-semibold disabled:opacity-50">Agregar trabajo</button>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
