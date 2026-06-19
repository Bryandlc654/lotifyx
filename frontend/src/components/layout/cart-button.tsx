"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function CartButton() {
  const { totalItems, toggleCart } = useCart();

  if (totalItems === 0) return null;

  return (
    <button
      onClick={toggleCart}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-cyan-400 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
    >
      <ShoppingCart className="h-6 w-6" />
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
        {totalItems}
      </span>
    </button>
  );
}
