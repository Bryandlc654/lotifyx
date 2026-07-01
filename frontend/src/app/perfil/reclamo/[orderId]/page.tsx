"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getMyOrders, getImageUrl, submitClaim, isAuthenticated, removeTokens, getProfile } from "@/lib/api";
import { ChevronRight, ExternalLink, Upload, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Seller {
  id: string; first_name: string; last_name: string; email: string; phone: string;
}
interface OrderItem {
  id: string; product_id: string; product_title?: string; price: number; seller?: Seller;
}

interface Order {
  id: string; total_amount: number; status: string; created_at: string;
  items: OrderItem[];
}

const REASONS = [
  "Producto en mal estado",
  "Producto incompleto",
  "Producto no es el que pedí",
  "Producto no funciona",
  "No recibí el producto",
  "Otro",
];

export default function ReclamoPage({ params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState("");
  const [solution, setSolution] = useState("Devolución parcial");
  const [amount, setAmount] = useState("");
  const [userRole, setUserRole] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then((d) => setUserRole(d.user?.role?.name || ""))
      .catch(() => { removeTokens(); router.push("/"); });

    getMyOrders()
      .then(async (orders: Order[]) => {
        const found = orders.find(o => o.id === orderId);
        if (!found) { toast.error("Pedido no encontrado"); router.push("/perfil/mis-compras"); return; }
        setOrder(found);
        setAmount(String(found.total_amount));
      })
      .catch(() => toast.error("Error al cargar pedido"))
      .finally(() => setLoading(false));
  }, [orderId, router]);

  async function handleSubmit() {
    if (!description.trim()) { toast.error("Describe el problema"); return; }
    setSubmitting(true);
    try {
      await submitClaim({
        order_id: orderId,
        reason,
        description: description.trim(),
        solution,
        amount: solution === "Devolución parcial" ? parseFloat(amount) || 0 : undefined,
      });
      setShowSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Error al enviar reclamo");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <><Header /><main className="pt-32 min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></main><Footer /></>;
  }

  if (!order) return null;

  const firstSeller = order.items[0]?.seller;
  const sellerName = firstSeller ? `${firstSeller.first_name} ${firstSeller.last_name}` : "Vendedor";

  return (
    <>
      <Header />
      <main className="bg-[#F8FAFC] min-h-screen pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <nav className="flex items-center gap-2 text-sm mb-2">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">Inicio</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <button onClick={() => router.push("/perfil/mis-compras")} className="text-gray-400 hover:text-gray-600">Mis Compras</button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-[#8B5CF6] font-semibold">Generar Reclamo</span>
          </nav>

          <header>
            <h1 className="text-2xl font-bold text-gray-900">Generar Reclamo</h1>
            <p className="text-gray-500 text-sm mt-1">Cuéntanos qué sucedió con tu pedido para que podamos ayudarte.</p>
          </header>

          {/* Product card */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <PackageIcon />
                </div>
                <button onClick={() => router.push(`/producto/${order.items[0]?.product_id}`)}
                  className="mt-4 border border-purple-500 text-purple-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-purple-50 transition-colors">
                  Ver producto <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              <div className="w-full md:w-2/3">
                {order.items.map(item => (
                  <div key={item.id}>
                    <h2 className="text-lg font-bold text-gray-900">{item.product_title || "Producto"}</h2>
                    <p className="text-xs text-gray-400 mt-1">Precio: <span className="font-semibold">S/ {Number(item.price).toFixed(2)}</span></p>
                  </div>
                ))}
                {firstSeller && (
                  <div className="mt-3">
                    <span className="text-xs text-gray-500 block">Vendido por</span>
                    <span className="text-sm font-bold text-gray-800">{sellerName}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Payment summary */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Resumen de pago</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-gray-100 p-3 rounded-lg flex items-center gap-3">
                <div className="bg-gray-50 p-2 rounded-md text-gray-400">S/</div>
                <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Precio pagado</p><p className="text-sm font-bold text-gray-700">S/ {Number(order.total_amount).toFixed(2)}</p></div>
              </div>
              <div className="border border-gray-100 p-3 rounded-lg flex items-center gap-3">
                <div className="bg-gray-50 p-2 rounded-md text-gray-400">📅</div>
                <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Fecha de compra</p><p className="text-sm font-bold text-gray-700">{new Date(order.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric" })}</p></div>
              </div>
              <div className="border border-gray-100 p-3 rounded-lg flex items-center gap-3">
                <div className="bg-gray-50 p-2 rounded-md text-gray-400">📦</div>
                <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Estado</p><p className="text-sm font-bold text-gray-700">{order.status === "completed" ? "Completado" : order.status}</p></div>
              </div>
              <div className="border border-gray-100 p-3 rounded-lg flex items-center gap-3">
                <div className="bg-gray-50 p-2 rounded-md text-gray-400">🏦</div>
                <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Medio de pago</p><p className="text-sm font-bold text-gray-700">Depósito bancario</p></div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reason */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Motivo de reclamo</h3>
              <p className="text-xs text-gray-500 mb-6">Selecciona el motivo que mejor describe tu caso</p>
              <label className="text-[11px] font-bold text-gray-700 mb-1 block">Motivo <span className="text-red-500">*</span></label>
              <select value={reason} onChange={e => setReason(e.target.value)}
                className="w-full border-gray-200 rounded-lg text-sm py-2.5 px-3 focus:ring-purple-500 focus:border-purple-500">
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Describe el problema</h3>
              <p className="text-xs text-gray-500 mb-6">Bríndanos más detalles sobre lo ocurrido.</p>
              <label className="text-[11px] font-bold text-gray-700 mb-1 block">Descripción <span className="text-red-500">*</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                className="w-full border-gray-200 rounded-lg text-sm p-3 h-28 focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-300"
                placeholder="Explica qué sucedió, cuándo lo notaste y cualquier detalle que consideres importante..." />
            </div>
          </div>

          {/* Solution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-1">¿Qué solución solicitas?</h3>
            <p className="text-xs text-gray-500 mb-6">Selecciona la solución que deseas para tu pedido.</p>
            <div className="space-y-4">
              {[
                { value: "Cancelación de la compra", label: "Cancelación de la compra", desc: "Devolución total del dinero y devolución del producto." },
                { value: "Reposición del producto", label: "Reposición del producto", desc: "Solicitar un reemplazo del producto recibido." },
                { value: "Devolución parcial", label: "Devolución parcial", desc: "Solicitar una compensación económica parcial." },
              ].map(opt => (
                <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="solution" value={opt.value} checked={solution === opt.value} onChange={e => setSolution(e.target.value)}
                    className="mt-1 text-purple-600 focus:ring-purple-500 border-gray-300" />
                  <div>
                    <p className="text-xs font-bold text-gray-700">{opt.label}</p>
                    <p className="text-[10px] text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {solution === "Devolución parcial" && (
              <div className="mt-4">
                <label className="text-[11px] font-bold text-gray-700 mb-1 block">Monto solicitado <span className="text-red-500">*</span></label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm text-gray-500">S/</span>
                  <input value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full pl-8 border-purple-500 rounded-lg text-sm py-2.5 focus:ring-purple-500 focus:border-purple-500" placeholder="0.00" />
                </div>
              </div>
            )}
            <div className="mt-6 bg-blue-50 p-4 rounded-xl flex items-start gap-3">
              <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold italic">i</div>
              <p className="text-[10px] text-gray-600 leading-relaxed">Al enviar el reclamo, nuestro equipo lo revisará y te responderá en un plazo máximo de 3 a 5 días hábiles.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-8">
            <button onClick={handleSubmit} disabled={submitting}
              className="text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-purple-500/30 hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)" }}>
              {submitting ? "Enviando..." : "Enviar reclamo"}
            </button>
            <button onClick={() => router.back()}
              className="bg-gray-500 text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-600 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      </main>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reclamo enviado!</h2>
            <p className="text-sm text-gray-500 mb-2">Tu reclamo fue registrado correctamente.</p>
            <p className="text-xs text-gray-400 mb-8">Nuestro equipo lo revisará y te responderá en un plazo de 3 a 5 días hábiles.</p>
            <button onClick={() => router.push("/perfil/mis-compras")}
              className="w-full text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)" }}>
              Volver a mis compras
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

function PackageIcon() {
  return (
    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}
