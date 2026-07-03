"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { getSocket } from "./socket";
import { getUnreadCount, getCurrentUserId } from "./api";

interface Notification {
  id: string;
  conversationId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unread: number;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unread: 0,
  clearAll: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const handlerRef = useRef<((data: any) => void) | null>(null);

  useEffect(() => {
    getUnreadCount().then((r) => setUnread(r.unread)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    let cleanup: (() => void) | null = null;

    function connect() {
      if (cancelled) return;
      const socket = getSocket();
      if (!socket) {
        retries++;
        if (retries <= 10) setTimeout(connect, 500 * retries);
        return;
      }

      const currentUserId = getCurrentUserId();

      const handler = (data: any) => {
        if (data.sender_id === currentUserId) return;

        const notif: Notification = {
          id: data.id,
          conversationId: data.conversation_id,
          senderName: data.sender_name || "Usuario",
          text: data.text,
          timestamp: Date.now(),
        };

        setNotifications((prev) => [notif, ...prev].slice(0, 20));
        setUnread((prev) => prev + 1);

        if (pathname !== "/perfil/mensajes") {
          toast("Mensaje de " + notif.senderName, {
            description: notif.text,
            action: {
              label: "Ver",
              onClick: () => router.push(`/perfil/mensajes?conv=${notif.conversationId}`),
            },
            duration: 5000,
          });
        }
      };

      socket.on("new_message", handler);
      handlerRef.current = handler;
      cleanup = () => { socket.off("new_message", handler); };
    }

    connect();
    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnread(0);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unread, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}
