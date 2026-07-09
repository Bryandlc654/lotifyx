"use client";
import { useEffect, useState } from "react";

interface Props {
  endDate: string | Date;
  onEnded: () => void;
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

export function AuctionCountdown({ endDate, onEnded }: Props) {
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

  if (!remaining) return null;

  const parts = [
    remaining.d > 0 && `${remaining.d}d`,
    remaining.h > 0 || remaining.d > 0 ? `${remaining.h}h` : null,
    `${remaining.m}m`,
    `${remaining.s}s`,
  ].filter(Boolean);

  return (
    <div className="text-center py-3 bg-gradient-to-r from-purple-50 to-cyan-50 rounded-xl border border-purple-100">
      <span className="text-xs text-gray-500 font-medium">Tiempo restante</span>
      <p className="text-lg font-bold text-purple-700 font-mono tracking-wider">
        {parts.join(" ")}
      </p>
    </div>
  );
}
