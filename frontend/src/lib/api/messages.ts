import { API_URL, authFetch } from "./client";

export async function getConversations(): Promise<import("./common").Conversation[]> {
  const res = await authFetch(`${API_URL}/messages/conversations`);
  if (!res.ok) throw new Error("Error al obtener conversaciones");
  return res.json();
}

export async function createOrGetConversation(sellerId: string, productId?: string): Promise<import("./common").Conversation> {
  const res = await authFetch(`${API_URL}/messages/conversations`, {
    method: "POST",
    body: JSON.stringify({ seller_id: sellerId, product_id: productId }),
  });
  if (!res.ok) throw new Error("Error al crear conversación");
  return res.json();
}

export async function getMessages(conversationId: string): Promise<import("./common").MessageData[]> {
  const res = await authFetch(`${API_URL}/messages/conversations/${conversationId}`);
  if (!res.ok) throw new Error("Error al obtener mensajes");
  return res.json();
}

export async function sendMessage(conversationId: string, text: string): Promise<import("./common").MessageData> {
  const res = await authFetch(`${API_URL}/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Error al enviar mensaje");
  return res.json();
}

export async function getUnreadCount(): Promise<{ unread: number }> {
  const res = await authFetch(`${API_URL}/messages/unread-count`);
  if (!res.ok) return { unread: 0 };
  return res.json();
}

export async function markAsRead(messageId: string): Promise<void> {
  await authFetch(`${API_URL}/messages/${messageId}/read`, { method: "PUT" });
}

export async function markAllAsRead(conversationId: string): Promise<void> {
  await authFetch(`${API_URL}/messages/conversations/${conversationId}/read-all`, { method: "PUT" });
}
