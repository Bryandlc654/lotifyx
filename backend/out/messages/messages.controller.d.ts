import { MessagesService } from "./messages.service";
export declare class MessagesController {
    private readonly service;
    constructor(service: MessagesService);
    createConversation(req: any, dto: {
        seller_id: string;
        product_id?: string;
    }): Promise<import("./conversation.entity").Conversation | null>;
    getConversations(req: any): Promise<any[]>;
    getMessages(req: any, id: string): Promise<import("./message.entity").Message[]>;
    sendMessage(req: any, id: string, dto: {
        text: string;
    }): Promise<import("./message.entity").Message | null>;
    getUnreadCount(req: any): Promise<{
        unread: any;
    }>;
    markAsRead(req: any, id: string): Promise<import("./message.entity").Message>;
    markAllAsRead(req: any, id: string): Promise<{
        message: string;
    }>;
}
