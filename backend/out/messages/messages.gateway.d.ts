import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
export declare class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    server: Server;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinConversation(client: Socket, conversationId: string): void;
    handleLeaveConversation(client: Socket, conversationId: string): void;
    notifyNewMessage(conversationId: string, message: any): void;
    notifyUnreadUpdate(userId: string, unread: number): void;
}
