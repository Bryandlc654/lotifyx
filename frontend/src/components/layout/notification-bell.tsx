"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, MessageCircle } from "lucide-react";
import { useNotifications } from "@/lib/notification-context";

export function NotificationBell() {
  const { notifications, unread, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-500" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center bg-purple-600 text-white text-[9px] font-bold rounded-full min-w-[18px] min-h-[18px]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-96 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-800">Notificaciones</p>
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-[10px] text-gray-400 hover:text-gray-600">
                Limpiar todo
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell className="h-8 w-8 mb-2" />
                <p className="text-xs">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { setOpen(false); router.push(`/perfil/mensajes?conv=${n.conversationId}`); }}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                    {n.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{n.senderName}</p>
                    <p className="text-[11px] text-gray-500 truncate">{n.text}</p>
                  </div>
                  <MessageCircle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-1" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
