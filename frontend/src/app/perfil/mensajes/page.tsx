"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  getConversations, getMessages, sendMessage,
  createOrGetConversation, getProfile, markAllAsRead,
  isAuthenticated, removeTokens, Conversation, MessageData, getImageUrl,
} from "@/lib/api";
import { getSocket, joinConversation, leaveConversation } from "@/lib/socket";
import { toast } from "sonner";
import { MessageCircle, Send, ArrowLeft, Loader2, ShoppingBag, User, Check, CheckCheck, Search, Wallet } from "lucide-react";

function MensajesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [mobileConvOpen, setMobileConvOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const pendingMsgIds = useRef<Set<string>>(new Set());

  const currentUserId = profile?.id;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    getProfile()
      .then((data) => {
        const u = (data as any).user as any;
        setProfile(u);
        setUserRole(u?.role?.name || "");
        return getConversations();
      })
      .then((convs) => {
        setConversations(convs);
        const convId = searchParams.get("conv");
        if (convId && convs.find((c: Conversation) => c.id === convId)) {
          setSelectedConv(convId);
        }
      })
      .catch(() => { removeTokens(); router.push("/"); })
      .finally(() => setLoading(false));
  }, [router, searchParams]);

  useEffect(() => {
    if (!selectedConv) return;
    getMessages(selectedConv).then((msgs) => {
      setMessages(msgs);
      markAllAsRead(selectedConv).catch(() => {});
    });

    joinConversation(selectedConv);
    const socket = getSocket();

    const handleNewMessage = (msg: MessageData) => {
      if (msg.conversation_id !== selectedConv) return;
      if (pendingMsgIds.current.has(msg.id)) {
        pendingMsgIds.current.delete(msg.id);
        return;
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      markAllAsRead(selectedConv).catch(() => {});
    };

    socket?.on("new_message", handleNewMessage);

    return () => {
      leaveConversation(selectedConv);
      socket?.off("new_message", handleNewMessage);
    };
  }, [selectedConv]);

  async function handleSend() {
    if (!text.trim() || !selectedConv || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    const msgText = text.trim();
    try {
      const msg = await sendMessage(selectedConv, msgText);
      pendingMsgIds.current.add(msg.id);
      setText("");
      setConversations((prev) => prev.map((c) =>
        c.id === selectedConv ? { ...c, last_message: msgText, last_message_at: msg.created_at, unread_count: 0 } : c
      ));
    } catch {
      toast.error("Error al enviar mensaje");
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleStartChat(sellerId: string, productId?: string) {
    try {
      const conv = await createOrGetConversation(sellerId, productId);
      setSelectedConv(conv.id);
      setMobileConvOpen(true);
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        return exists ? prev : [conv, ...prev];
      });
    } catch (e: any) {
      toast.error(e.message || "Error al crear conversación");
    }
  }

  const selectedData = conversations.find((c) => c.id === selectedConv);
  const otherUser = selectedData
    ? (selectedData.buyer_id === currentUserId
        ? { id: selectedData.seller_id, name: `${selectedData.seller_first_name} ${selectedData.seller_last_name}`, email: selectedData.seller_email, avatar: selectedData.seller_avatar }
        : { id: selectedData.buyer_id, name: `${selectedData.buyer_first_name} ${selectedData.buyer_last_name}`, email: selectedData.buyer_email, avatar: selectedData.buyer_avatar })
    : null;

  const filteredConvs = conversations.filter((c) => {
    const other = c.buyer_id === currentUserId
      ? `${c.seller_first_name} ${c.seller_last_name}`
      : `${c.buyer_first_name} ${c.buyer_last_name}`;
    return other.toLowerCase().includes(searchTerm.toLowerCase()) || (c.product_title || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-24 min-h-screen bg-[#f5f6f8] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f5f6f8]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-8 flex items-start justify-center gap-32">
          {/* Sidebar */}
          <nav className="w-44 flex-shrink-0 pt-8 space-y-1">
            <button onClick={() => router.push("/perfil")}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
              Editar Perfil
            </button>
            {userRole === "vendedor" && (
              <button onClick={() => router.push("/perfil/dashboard")}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
                Dashboard
              </button>
            )}
            {userRole !== "superadmin" && (
              <button onClick={() => router.push("/perfil/mis-compras")}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
                Mis Compras
              </button>
            )}
            {userRole !== "superadmin" && (
              <button onClick={() => router.push("/perfil/mensajes")}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 border-l-2 border-slate-700 -ml-px">
                Mensajes
              </button>
            )}
            {userRole !== "superadmin" && (
              <button onClick={() => router.push("/perfil/mis-cuentas")}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
                Mis Cuentas
              </button>
            )}
            {userRole === "vendedor" && (
              <button onClick={() => router.push("/perfil/mis-ventas")}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
                Mis Ventas
              </button>
            )}
            {userRole === "vendedor" && (
              <button onClick={() => router.push("/perfil/mis-fondos")}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
                Mis Fondos
              </button>
            )}
            {userRole === "vendedor" && (
              <button onClick={() => router.push("/perfil/carga-masiva")}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
                Carga Masiva
              </button>
            )}
            {userRole === "vendedor" && (
              <button onClick={() => router.push("/perfil/mis-productos")}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
                Mis Productos
              </button>
            )}
            {userRole === "vendedor" && (
              <button onClick={() => router.push("/perfil/ofrecer")}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
                Ofrecer
              </button>
            )}
            {userRole === "vendedor" && (
              <button onClick={() => router.push("/perfil/mi-plan")}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 border-l-2 border-transparent -ml-px hover:text-slate-600">
                Mi Plan
              </button>
            )}
          </nav>

          <div className="max-w-5xl w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8234FE] to-[#26BEFE] flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mensajes</h1>
              <p className="text-sm text-gray-500">{conversations.length} conversaciones</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex h-[calc(100vh-280px)] min-h-[500px]">
              {/* Conversation List */}
              <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col ${mobileConvOpen ? "hidden md:flex" : "flex"}`}>
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar conversación..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredConvs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                      <MessageCircle className="w-10 h-10 mb-3" />
                      <p className="text-sm">{searchTerm ? "Sin resultados" : "No hay conversaciones"}</p>
                      <p className="text-xs mt-1">Los mensajes aparecerán aquí</p>
                    </div>
                  ) : (
                    filteredConvs.map((conv) => {
                      const isBuyer = conv.buyer_id === currentUserId;
                      const name = isBuyer ? `${conv.seller_first_name} ${conv.seller_last_name}` : `${conv.buyer_first_name} ${conv.buyer_last_name}`;
                      const avatar = isBuyer ? conv.seller_avatar : conv.buyer_avatar;
                      return (
                        <button
                          key={conv.id}
                          onClick={() => { setSelectedConv(conv.id); setMobileConvOpen(true); }}
                          className={`w-full text-left px-4 py-3.5 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${selectedConv === conv.id ? "bg-purple-50" : ""}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {avatar ? <img src={getImageUrl(avatar)} className="w-10 h-10 rounded-full object-cover" /> : name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm font-semibold text-gray-800 truncate">{name}</span>
                              {conv.last_message_at && (
                                <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                                  {new Date(conv.last_message_at).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {conv.product_title && (
                                <span className="text-[10px] text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded truncate max-w-[120px]">{conv.product_title}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-1">{conv.last_message || "Sin mensajes"}</p>
                          </div>
                          {conv.unread_count > 0 && (
                            <div className="shrink-0">
                              <div className="w-5 h-5 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">
                                {conv.unread_count > 9 ? "9+" : conv.unread_count}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className={`flex-1 flex flex-col ${!mobileConvOpen ? "hidden md:flex" : "flex"}`}>
                {!selectedConv ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                    <MessageCircle className="w-16 h-16 mb-4 text-gray-200" />
                    <p className="text-lg font-semibold text-gray-600">Selecciona una conversación</p>
                    <p className="text-sm mt-1">Elige un chat del panel izquierdo para empezar</p>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
                      <button onClick={() => setMobileConvOpen(false)} className="md:hidden p-1 -ml-1">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                      </button>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {otherUser?.avatar ? <img src={getImageUrl(otherUser.avatar)} className="w-9 h-9 rounded-full object-cover" /> : otherUser?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{otherUser?.name || "Usuario"}</p>
                        <p className="text-[10px] text-gray-400 truncate">{otherUser?.email || ""}</p>
                      </div>
                      {selectedData?.product_title && (
                        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">{selectedData.product_title}</span>
                        </div>
                      )}
                    </div>

                    {/* Messages */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                      {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <p className="text-sm">No hay mensajes aún</p>
                          <p className="text-xs mt-1">Envía el primer mensaje</p>
                        </div>
                      )}
                      {messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-purple-600 text-white rounded-br-md" : "bg-white text-gray-700 border border-gray-100 rounded-bl-md shadow-sm"}`}>
                              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                              <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                <span className={`text-[9px] ${isMe ? "text-purple-200" : "text-gray-400"}`}>
                                  {new Date(msg.created_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {isMe && (
                                  msg.read_at ? <CheckCheck className="w-3 h-3 text-purple-200" /> : <Check className="w-3 h-3 text-purple-300" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 bg-white">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 relative">
                          <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe un mensaje..."
                            rows={1}
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                            style={{ minHeight: "42px", maxHeight: "120px" }}
                          />
                        </div>
                        <button
                          onClick={handleSend}
                          disabled={!text.trim() || sending}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-600 text-white disabled:opacity-40 hover:bg-purple-700 transition-colors shrink-0"
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function MensajesPage() {
  return (
    <Suspense fallback={
      <main className="pt-24 min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </main>
    }>
      <MensajesContent />
    </Suspense>
  );
}
