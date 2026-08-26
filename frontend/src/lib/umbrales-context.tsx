"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getUmbrales, Umbrales } from "@/lib/api";
import { onUmbralesUpdate, offUmbralesUpdate } from "@/lib/socket";

const UmbralesContext = createContext<Umbrales | null>(null);

export function UmbralesProvider({ children }: { children: React.ReactNode }) {
  const [umbrales, setUmbrales] = useState<Umbrales | null>(null);

  useEffect(() => {
    getUmbrales().then(setUmbrales).catch(() => {});
    onUmbralesUpdate((data: Umbrales) => setUmbrales(data));
    return () => offUmbralesUpdate();
  }, []);

  return (
    <UmbralesContext.Provider value={umbrales}>
      {children}
    </UmbralesContext.Provider>
  );
}

export function useUmbrales(): Umbrales | null {
  return useContext(UmbralesContext);
}
