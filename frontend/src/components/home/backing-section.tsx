"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getBackingLogos, BackingLogo } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const VISIBLE = 4;

export function BackingSection() {
  const [items, setItems] = useState<BackingLogo[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getBackingLogos().then(d => { setItems(d.filter(b => b.is_active)); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const total = items.length;

  const next = () => {
    if (total <= VISIBLE) return;
    setCurrent(prev => prev >= total - 1 ? 0 : prev + 1);
  };

  const prev = () => {
    if (total <= VISIBLE) return;
    setCurrent(prev => prev <= 0 ? total - 1 : prev - 1);
  };

  if (!loaded || total === 0) return null;

  const displayItems = [...items, ...items, ...items];

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-6 flex items-center gap-8">
        <h2 className="text-[20px] sm:text-[24px] font-bold text-gray-900 leading-tight uppercase flex-shrink-0">
          CON EL RESPALDO DE:
        </h2>

        <div className="relative flex-1 min-w-0">
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${(current + total) * (100 / VISIBLE)}%)` }}>
              {displayItems.map((b, i) => (
                <div key={`${b.id}-${i}`} className="flex-shrink-0 flex items-center justify-center"
                  style={{ width: `${100 / VISIBLE}%` }}>
                  <img src={b.image_url.startsWith("http") ? b.image_url : `${API_URL}${b.image_url}`}
                    alt={b.name} className="h-10 sm:h-12 object-contain" />
                </div>
              ))}
            </div>
          </div>

          {total > VISIBLE && (
            <>
              <button onClick={prev}
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white shadow-md border text-gray-500 hover:text-gray-700">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={next}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white shadow-md border text-gray-500 hover:text-gray-700">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
