"use client";

import { useEffect, useState, useCallback } from "react";
import { getBanners, Banner, getImageUrl } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const INTERVAL = 5000;

export function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getBanners()
      .then((data) => {
        setBanners(data.filter((b) => b.is_active));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const total = banners.length;

  const goTo = useCallback((index: number) => {
    setCurrent(((index % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [total, next]);

  if (!loaded || total === 0) return null;

  return (
    <div className="relative w-full overflow-hidden bg-gray-100">
      <div className="relative aspect-[16/7] sm:aspect-[16/6] lg:aspect-[16/5] min-h-[340px] max-h-[560px]">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img
              src={getImageUrl(banner.image_url)}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Flechas */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 hover:scale-110 transition-transform"
            >
              <img src="/preview.svg" alt="Anterior" className="h-8 w-auto" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 hover:scale-110 transition-transform"
            >
              <img src="/next.svg" alt="Siguiente" className="h-8 w-auto" />
            </button>
          </>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Paginación */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {banners.map((_, i) => (
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
  );
}
