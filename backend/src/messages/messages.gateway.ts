import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";

@WebSocketGateway({
  cors: { origin: "*", credentials: true },
  namespace: "/ws/messages",
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token as string;
      if (!token) { client.disconnect(); return; }
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {}

  @SubscribeMessage("join_conversation")
  handleJoinConversation(client: Socket, conversationId: string) {
    client.join(`conv:${conversationId}`);
  }

  @SubscribeMessage("leave_conversation")
  handleLeaveConversation(client: Socket, conversationId: string) {
    client.leave(`conv:${conversationId}`);
  }

  @SubscribeMessage("join_product")
  handleJoinProduct(client: Socket, productId: string) {
    client.join(`product:${productId}`);
  }

  @SubscribeMessage("leave_product")
  handleLeaveProduct(client: Socket, productId: string) {
    client.leave(`product:${productId}`);
  }

  @SubscribeMessage("join_request")
  handleJoinRequest(client: Socket, requestId: string) {
    client.join(`request:${requestId}`);
  }

  @SubscribeMessage("leave_request")
  handleLeaveRequest(client: Socket, requestId: string) {
    client.leave(`request:${requestId}`);
  }

  notifyNewMessage(conversationId: string, message: any) {
    this.server.to(`conv:${conversationId}`).emit("new_message", message);
  }

  notifyUnreadUpdate(userId: string, unread: number) {
    this.server.to(`user:${userId}`).emit("unread_update", { unread });
  }

  notifyNewBid(productId: string, data: { precio_actual: number; bid_count: number; highest_bid: number; estado?: string; ganador_id?: string | null }) {
    this.server.to(`product:${productId}`).emit("auction_update", data);
  }

  /** Difusión en tiempo real de la demanda agregada (lotes): volumen comprometido y umbral */
  notifyLotUpdate(productId: string, data: { cantidad_reservada: number; participantes_count: number; umbral: number; estado: string; meta_venta?: number | null; cantidad_total?: number; tier_actual?: any; expectativa_superada?: boolean; porcentaje_demanda_vigente?: number; ua_alcanzado?: boolean }) {
    this.server.to(`product:${productId}`).emit("lot_update", data);
  }

  /** Difusión en tiempo real de ofertas en una solicitud (subasta inversa / RFQ) */
  notifyRequestUpdate(requestId: string, data: { offers_count: number; mejor_precio: number | null; estado: string }) {
    this.server.to(`request:${requestId}`).emit("request_update", data);
  }

  /** Difusión en tiempo real de los umbrales a todos los clientes conectados */
  notifyUmbralesUpdate(data: any) {
    this.server.emit("umbrales_update", data);
  }

  /** Notificación dirigida a un usuario específico (superado, oferta recibida, umbral alcanzado, etc.) */
  notifyUser(userId: string, data: { tipo: string; titulo: string; mensaje?: string; url?: string }) {
    this.server.to(`user:${userId}`).emit("user_notification", data);
  }
}
