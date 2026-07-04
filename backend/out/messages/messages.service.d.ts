import { Repository } from "typeorm";
import { Conversation } from "./conversation.entity";
import { Message } from "./message.entity";
import { MessagesGateway } from "./messages.gateway";
export declare class MessagesService {
    private readonly convRepo;
    private readonly msgRepo;
    private readonly gateway;
    constructor(convRepo: Repository<Conversation>, msgRepo: Repository<Message>, gateway: MessagesGateway);
    getConversations(userId: string): Promise<any[]>;
    createOrGetConversation(buyerId: string, sellerId: string, productId?: string): Promise<Conversation | null>;
    getMessages(conversationId: string, userId: string): Promise<Message[]>;
    sendMessage(conversationId: string, senderId: string, text: string): Promise<Message | null>;
    markAsRead(messageId: string, userId: string): Promise<Message>;
    markAllAsRead(conversationId: string, userId: string): Promise<{
        message: string;
    }>;
    getUnreadCount(userId: string): Promise<{
        unread: any;
    }>;
}
