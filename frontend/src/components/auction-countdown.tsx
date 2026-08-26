"use client";
import { useEffect, useState } from "react";

interface Props {
  endDate: string | Date;
  onEnded: () => void;
  estado?: string;
}

function getRemaining(end: Date) {
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { d, h, m, s };
}

export function AuctionCountdown({ endDate, onEnded, estado }: Props) {
  const [remaining, setRemaining] = useState(() => getRemaining(new Date(endDate)));

  useEffect(() => {
    const tick = setInterval(() => {
      const r = getRemaining(new Date(endDate));
      setRemaining(r);
      if (!r) {
        clearInterval(tick);
        onEnded();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [endDate, onEnded]);

  if (!remaining) {
    return (
      <div className="text-center py-3 rounded-xl border border-slate-200 bg-slate-50">
        <span className="text-xs text-gray-400 font-medium">Estado</span>
        <p className="text-lg font-bold text-slate-500 font-mono tracking-wider">Finalizado</p>
      </div>
    );
  }

  // Estado temporal conforme a Tiempo_Public: por cerrar / en vivo
  const totalSec = remaining.d * 86400 + remaining.h * 3600 + remaining.m * 60 + remaining.s;
  const porCerrar = totalSec <= 3600; // menos de 1 hora
  const label = estado === "cerrado" || estado === "aceptada" ? "Finalizado"
    : porCerrar ? "Por cerrar" : "En vivo";

  const parts = [
    remaining.d > 0 && `${remaining.d}d`,
    remaining.h > 0 || remaining.d > 0 ? `${remaining.h}h` : null,
    `${remaining.m}m`,
    `${remaining.s}s`,
  ].filter(Boolean);

  const bg = porCerrar
    ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
    : "bg-gradient-to-r from-purple-50 to-cyan-50 border-purple-100";
  const text = porCerrar ? "text-orange-600" : "text-purple-700";

  return (
    <div className={`text-center py-3 rounded-xl border ${bg}`}>
      <span className="text-xs text-gray-500 font-medium">Estado · Tiempo restante</span>
      <p className={`text-lg font-bold font-mono tracking-wider ${text}`}>
        {label} · {parts.join(" ")}
      </p>
    </div>
  );
}
