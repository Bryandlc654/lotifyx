"use client";

import { X, Trash2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { getImageUrl } from "@/lib/api";

export function CartSidebar() {
  const router = useRouter();
  const { items, isOpen, closeCart, removeItem, clearCart } = useCart();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={closeCart} />
      )}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Carrito</h2>
            <span className="text-sm text-gray-400">({items.length})</span>
          </div>
          <button onClick={closeCart} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <ShoppingCart className="h-12 w-12" />
              <p className="text-sm">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 bg-gray-50 rounded-xl p-3">
                  <div className="w-20 h-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h4>
                    {item.sku && <p className="text-xs text-gray-400">Lot: {item.sku}</p>}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-gray-900">S/ {item.price.toFixed(2)}</span>
                      <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total ({items.length} items)</span>
              <span className="font-bold text-gray-900">
                S/ {items.reduce((sum, i) => sum + i.price, 0).toFixed(2)}
              </span>
            </div>
            <button onClick={() => { closeCart(); router.push("/checkout"); }}
              className="w-full font-semibold py-3 rounded-xl text-white shadow-sm text-sm" style={{ backgroundColor: "#6b778d" }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "#586375"}
              onMouseOut={e => e.currentTarget.style.backgroundColor = "#6b778d"}>
              Ir a pagar
            </button>
            <button onClick={clearCart} className="w-full text-sm text-gray-400 hover:text-red-500 transition-colors py-1">
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
}
