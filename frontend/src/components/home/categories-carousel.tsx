"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCategories, Category } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const VISIBLE = 4;

export function CategoriesCarousel() {
  const [cats, setCats] = useState<Category[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getCategories().then(data => {
      const flat: Category[] = [];
      const flatten = (items: Category[]) => {
        for (const item of items) {
          if (item.status === "active") flat.push(item);
          if (item.children?.length) flatten(item.children);
        }
      };
      flatten(data);
      setCats(flat);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const total = cats.length;
  const pages = Math.ceil(total / VISIBLE);

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % pages) + pages) % pages);
  }, [pages]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (pages <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [pages, next]);

  if (!loaded || total === 0) return null;

  const visibleItems = cats.length >= 4 ? cats : [...cats, ...Array(4 - cats.length).fill(null)];

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-left mb-8">
          <h2 className="text-[32px] font-bold text-gray-900 leading-tight">Categorías</h2>
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {/* Duplicate for infinite loop */}
              {[...Array(Math.max(1, pages * 2))].map((_, pageIdx) => (
                <div key={pageIdx} className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full flex-shrink-0 px-0.5">
                  {visibleItems.map((cat, i) => {
                    if (!cat) return <div key={`empty-${i}`} />;
                    const imgSrc = cat.icon
                      ? (cat.icon.startsWith("http") ? cat.icon : `${API_URL}${cat.icon}`)
                      : null;

                    return (
                      <div key={`${cat.id}-${pageIdx}`} className="flex items-center gap-5 py-2">
                        {imgSrc ? (
                          <img src={imgSrc} alt={cat.name} className="w-[85px] h-[85px] object-contain flex-shrink-0" />
                        ) : (
                          <div className="w-[85px] h-[85px] rounded-lg bg-gray-100 flex-shrink-0" />
                        )}
                        <span className="text-[20px] text-[#344054] line-clamp-2 leading-tight">{cat.name}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          {pages > 1 && (
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

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 ${
                  i === current
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
