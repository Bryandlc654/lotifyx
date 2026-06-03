"use client";

import { useEffect, useState } from "react";
import { getTestimonials, Testimonial } from "@/lib/api";
import { Star } from "lucide-react";

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getTestimonials()
      .then((data) => { setItems(data.filter(i => i.is_active)); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || items.length === 0) return null;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-left mb-12">
          <h2 className="text-[32px] font-bold text-gray-900 leading-tight">
            Historias reales de quienes ya venden con nosotros
          </h2>
          <p className="text-base text-gray-500 mt-3 max-w-2xl">
            Personas y emprendedores que confiaron en nuestra plataforma y hoy hacen crecer su negocio de forma simple, segura y sin complicaciones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#F4F6F7] rounded-2xl p-6 sm:p-7 flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${n <= item.stars ? "fill-[#FBBC04] text-[#FBBC04]" : "text-gray-300"}`}
                  />
                ))}
              </div>

              <p className="text-[#344054] text-sm leading-relaxed flex-1">
                "{item.text}"
              </p>

              <div className="mt-5">
                <p className="font-bold text-xs text-[#344054]">{item.name}</p>
                <p className="text-xs text-[#344054]/60 mt-0.5">{item.cargo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
