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

  notifyNewMessage(conversationId: string, message: any) {
    this.server.to(`conv:${conversationId}`).emit("new_message", message);
  }

  notifyUnreadUpdate(userId: string, unread: number) {
    this.server.to(`user:${userId}`).emit("unread_update", { unread });
  }

  notifyNewBid(productId: string, data: { precio_actual: number; bid_count: number; highest_bid: number; estado?: string; ganador_id?: string | null }) {
    this.server.to(`product:${productId}`).emit("auction_update", data);
  }
}
