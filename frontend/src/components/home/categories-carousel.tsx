"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCategories, Category, getImageUrl } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const VISIBLE = 4;

export function CategoriesCarousel({ showTitle = true, bgWhite = true, showArrows = true, compact = false, selectedCategoryId, onCategorySelect }: {
  showTitle?: boolean; bgWhite?: boolean; showArrows?: boolean; compact?: boolean;
  selectedCategoryId?: string; onCategorySelect?: (id: string) => void;
}) {
  const [cats, setCats] = useState<Category[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getCategories().then(data => {
      const filtered = data.filter(c => c.status === "active" && (!c.parent_id || c.parent === null));
      setCats(filtered);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const total = cats.length;

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  const next = useCallback(() => {
    setCurrent(prev => {
      if (prev >= total - 1) return 0;
      return prev + 1;
    });
  }, [total]);

  const prev = useCallback(() => {
    setCurrent(prev => {
      if (prev <= 0) return total - 1;
      return prev - 1;
    });
  }, [total]);

  useEffect(() => {
    if (total <= VISIBLE) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [total, next]);

  if (!loaded || total === 0) return null;

  // Duplicate items for infinite loop effect
  const displayItems = [...cats, ...cats, ...cats];

  return (
    <section className={bgWhite ? "bg-white py-12 sm:py-16" : "py-0"}>
      <div className={bgWhite ? "max-w-7xl mx-auto px-6" : ""}>
        {showTitle && (
          <div className="text-left mb-8">
            <h2 className="text-[32px] font-bold text-gray-900 leading-tight">Categorías</h2>
          </div>
        )}

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${(current + total) * (100 / VISIBLE)}%)` }}
            >
              {displayItems.map((cat, i) => {
                const imgSrc = cat.icon
                  ? (cat.icon.startsWith("http") ? cat.icon : `${API_URL}${cat.icon}`)
                  : null;

                return (
                  <button
                    key={`${cat.id}-${i}`}
                    onClick={() => onCategorySelect?.(cat.id === selectedCategoryId ? "" : cat.id)}
                    className={`flex items-center gap-4 rounded-xl px-4 py-3 flex-shrink-0 mx-2 transition-all ${
                      selectedCategoryId === cat.id
                        ? "bg-[#8234FE] text-white shadow-md ring-2 ring-[#8234FE]/30"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    style={{ width: `calc(${100 / VISIBLE}% - 16px)` }}
                  >
                    {imgSrc ? (
                      <img src={imgSrc} alt={cat.name} className={`${compact ? "w-10 h-10" : "w-[85px] h-[85px]"} object-contain flex-shrink-0 ${selectedCategoryId === cat.id ? "brightness-0 invert" : ""}`} />
                    ) : (
                      <div className={`${compact ? "w-10 h-10" : "w-[85px] h-[85px]"} rounded-lg flex-shrink-0 ${selectedCategoryId === cat.id ? "bg-white/20" : "bg-gray-100"}`} />
                    )}
                    <span className={`${compact ? "text-sm" : "text-[20px]"} line-clamp-2 leading-tight text-left ${selectedCategoryId === cat.id ? "text-white" : "text-[#344054]"}`}>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {showArrows && total > VISIBLE && (
            <>
              <button onClick={prev}
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white shadow-md border border-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={next}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white shadow-md border border-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {total > VISIBLE && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {cats.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 ${
                  i === (current % total)
                    ? "w-6 h-2.5 rounded-full bg-gradient-to-r from-[#8234FE] to-[#26BEFE]"
                    : "w-2.5 h-2.5 rounded-full bg-[#D9D9D9] hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
