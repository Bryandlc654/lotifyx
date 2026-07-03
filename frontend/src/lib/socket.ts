import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./api";

let socket: Socket | null = null;
let pendingJoins = new Set<string>();
let listenersSetup = false;

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/ws/messages";

function setupSocket(s: Socket) {
  if (listenersSetup) return;
  listenersSetup = true;

  s.on("connect", () => {
    for (const convId of pendingJoins) {
      s.emit("join_conversation", convId);
    }
  });

  s.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      setTimeout(() => {
        if (getAccessToken()) {
          socket = null;
          listenersSetup = false;
          getSocket();
        }
      }, 2000);
    }
  });

  s.on("connect_error", () => {
    const newToken = getAccessToken();
    if (newToken && socket) {
      socket.close();
      socket = null;
      listenersSetup = false;
      getSocket();
    }
  });
}

export function getSocket(): Socket | null {
  if (socket && socket.connected) return socket;
  if (socket) return socket;

  const token = getAccessToken();
  if (!token) return null;

  socket = io(SOCKET_URL, {
    query: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  setupSocket(socket);
  return socket;
}

export function disconnectSocket() {
  pendingJoins.clear();
  listenersSetup = false;
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function joinConversation(conversationId: string) {
  pendingJoins.add(conversationId);
  const s = getSocket();
  if (s?.connected) {
    s.emit("join_conversation", conversationId);
  }
}

export function leaveConversation(conversationId: string) {
  pendingJoins.delete(conversationId);
  const s = getSocket();
  if (s?.connected) {
    s.emit("leave_conversation", conversationId);
  }
}
