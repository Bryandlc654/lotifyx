"use client";

import { useEffect, useState } from "react";
import { getMarquees, Marquee, getImageUrl } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function MarqueeLogos() {
  const [items, setItems] = useState<Marquee[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getMarquees()
      .then((data) => { setItems(data.filter(i => i.is_active)); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || items.length === 0) return null;

  return (
    <div className="w-full overflow-hidden bg-white py-6 border-b border-gray-100">
      <div className="marquee-track flex gap-12 px-6">
        {[...items, ...items].map((item, i) => (
          <img
            key={`${item.id}-${i}`}
            src={getImageUrl(item.image_url)}
            alt={item.name}
            className="h-12 sm:h-14 w-auto object-contain flex-shrink-0"
          />
        ))}
      </div>
    </div>
  );
}
