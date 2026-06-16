"use client";

import { useEffect, useState, useCallback } from "react";
import { getSecondaryBanners, SecondaryBanner, getImageUrl } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function BannerCard({ b }: { b: SecondaryBanner }) {
  return (
    <a href={b.link_url || "#"} target={b.link_url ? "_blank" : undefined}
      className="flex rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white h-[280px] w-full">
      <div className="flex-1 flex flex-col justify-center p-8 sm:p-10">
        {b.subtitle && <p className="text-gray-500 text-sm">{b.subtitle}</p>}
        <h3 className="text-[32px] font-bold text-gray-900 mt-1 leading-tight">{b.title}</h3>
        {b.button_text && (
          <span className="inline-block mt-6 px-6 py-2.5 rounded-lg bg-gradient-to-br from-[#8234FE] to-[#26BEFE] text-sm font-semibold text-white w-fit">
            {b.button_text}
          </span>
        )}
      </div>
      <div className="flex-1">
                  <img src={getImageUrl(b.image_url)}
          alt={b.title} className="w-full h-full object-cover rounded-2xl" />
      </div>
    </a>
  );
}

function PromoSlider({ items }: { items: SecondaryBanner[] }) {
  const [current, setCurrent] = useState(0);
  const total = items.length;

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [total, next]);

  if (total === 0) return null;

  return (
    <div className="flex-1">
      <div className="relative overflow-hidden rounded-2xl">
        {items.map((b, i) => (
          <div key={b.id}
            className={`transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}>
            <BannerCard b={b} />
          </div>
        ))}
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {items.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`transition-all duration-300 ${
                i === current
                  ? "w-6 h-2.5 rounded-full bg-gradient-to-r from-[#8234FE] to-[#26BEFE]"
                  : "w-2.5 h-2.5 rounded-full bg-[#D9D9D9] hover:bg-gray-400"
              }`} />
          ))}
        </div>
      )}
    </div>
  );
}

function Promo1Slider({ items }: { items: SecondaryBanner[] }) {
  const [current, setCurrent] = useState(0);
  const total = items.length;

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [total, next]);

  if (total === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 mb-6">
      <div className="relative overflow-hidden rounded-2xl">
        {items.map((b, i) => (
          <div key={b.id}
            className={`transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}>
            <a href={b.link_url || "#"} target={b.link_url ? "_blank" : undefined} className="block">
        <img src={getImageUrl(b.image_url)}
                alt={b.title} className="w-full h-[350px] object-cover" />
              {b.button_text && (
                <div className="absolute bottom-10 left-1/2 translate-x-2">
                  <span className="inline-block px-5 py-2 rounded-lg bg-white text-sm font-semibold text-[#26BEFE] hover:bg-gray-100 transition-colors shadow-md">
                    {b.button_text}
                  </span>
                </div>
              )}
            </a>
          </div>
        ))}
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-2 mt-24">
          {items.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`transition-all duration-300 ${
                i === current
                  ? "w-6 h-2.5 rounded-full bg-gradient-to-r from-[#8234FE] to-[#26BEFE]"
                  : "w-2.5 h-2.5 rounded-full bg-[#D9D9D9] hover:bg-gray-400"
              }`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PromoBanners() {
  const [promo1, setPromo1] = useState<SecondaryBanner[]>([]);
  const [promo2, setPromo2] = useState<SecondaryBanner[]>([]);
  const [promo3, setPromo3] = useState<SecondaryBanner[]>([]);

  useEffect(() => {
    getSecondaryBanners("promo1").then(d => setPromo1(d)).catch(() => {});
    getSecondaryBanners("promo2").then(d => setPromo2(d)).catch(() => {});
    getSecondaryBanners("promo3").then(d => setPromo3(d)).catch(() => {});
  }, []);

  if (!promo1.length && !promo2.length && !promo3.length) return null;

  return (
    <section className="bg-white py-8">
      <Promo1Slider items={promo1} />

      {(promo2.length > 0 || promo3.length > 0) && (
        <div className="max-w-7xl mx-auto px-6 flex gap-6 mt-6">
          <PromoSlider items={promo2} />
          <PromoSlider items={promo3} />
        </div>
      )}
    </section>
  );
}
