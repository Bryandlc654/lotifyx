import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { Conversation } from "./conversation.entity";
import { Message } from "./message.entity";
import { MessagesGateway } from "./messages.gateway";

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly msgRepo: Repository<Message>,
    private readonly gateway: MessagesGateway,
  ) {}

  async getConversations(userId: string) {
    const rows: any[] = await this.convRepo.query(
      `SELECT c.*,
        buyer.email AS buyer_email,
        buyer_profile.first_name AS buyer_first_name,
        buyer_profile.last_name AS buyer_last_name,
        buyer_profile.avatar_url AS buyer_avatar,
        seller.email AS seller_email,
        seller_profile.first_name AS seller_first_name,
        seller_profile.last_name AS seller_last_name,
        seller_profile.avatar_url AS seller_avatar,
        p.title AS product_title
       FROM conversations c
       LEFT JOIN users buyer ON buyer.id::text = c.buyer_id
       LEFT JOIN user_profiles buyer_profile ON buyer_profile.user_id::text = c.buyer_id
       LEFT JOIN users seller ON seller.id::text = c.seller_id
       LEFT JOIN user_profiles seller_profile ON seller_profile.user_id::text = c.seller_id
       LEFT JOIN products p ON p.id::text = c.product_id
       WHERE c.buyer_id = $1 OR c.seller_id = $1
       ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`,
      [userId]
    );
    const convIds = rows.map((r: any) => r.id);
    let unreadCounts: Record<string, number> = {};
    if (convIds.length) {
      const unreadRows = await this.convRepo.query(
        `SELECT c.id AS conv_id, COUNT(*)::int AS cnt
         FROM messages m
         INNER JOIN conversations c ON c.id = m.conversation_id::uuid
         WHERE c.id = ANY($1::uuid[]) AND m.sender_id != $2 AND m.read_at IS NULL
         GROUP BY c.id`,
        [convIds, userId]
      );
      for (const ur of unreadRows) {
        unreadCounts[ur.conv_id] = ur.cnt;
      }
    }
    return rows.map((r: any) => ({ ...r, unread_count: unreadCounts[r.id] || 0 }));
  }

  async createOrGetConversation(buyerId: string, sellerId: string, productId?: string) {
    if (buyerId === sellerId) throw new ForbiddenException("No puedes chatear contigo mismo");

    const existing = await this.convRepo.query(
      `SELECT id FROM conversations WHERE buyer_id = $1 AND seller_id = $2 ${productId ? "AND product_id = $3" : "AND product_id IS NULL"} LIMIT 1`,
      productId ? [buyerId, sellerId, productId] : [buyerId, sellerId]
    );

    if (existing.length) {
      return this.convRepo.findOne({ where: { id: existing[0].id } as any });
    }

    const result = await this.convRepo.query(
      `INSERT INTO conversations (buyer_id, seller_id, product_id) VALUES ($1, $2, $3) RETURNING *`,
      [buyerId, sellerId, productId || null]
    );

    return result[0] as Conversation;
  }

  async getMessages(conversationId: string, userId: string) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException("Conversación no encontrada");
    if (conv.buyer_id !== userId && conv.seller_id !== userId) {
      throw new ForbiddenException("No tienes acceso a esta conversación");
    }
    return this.msgRepo.find({
      where: { conversation_id: conversationId },
      order: { created_at: "ASC" },
      take: 200,
    });
  }

  async sendMessage(conversationId: string, senderId: string, text: string) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException("Conversación no encontrada");
    if (conv.buyer_id !== senderId && conv.seller_id !== senderId) {
      throw new ForbiddenException("No perteneces a esta conversación");
    }

    const msg = this.msgRepo.create({
      conversation_id: conversationId,
      sender_id: senderId,
      text,
    });
    await this.msgRepo.save(msg);

    await this.convRepo.update(conversationId, {
      last_message: text,
      last_message_at: new Date(),
    });

    const saved = await this.msgRepo.findOne({ where: { id: msg.id } });

    const senderProfile = await this.convRepo.query(
      `SELECT first_name, last_name FROM user_profiles WHERE user_id = $1`,
      [senderId]
    );
    const senderName = senderProfile[0]
      ? `${senderProfile[0].first_name} ${senderProfile[0].last_name}`.trim()
      : "Usuario";

    this.gateway.notifyNewMessage(conversationId, { ...saved, sender_name: senderName });
    const recipientId = conv.buyer_id === senderId ? conv.seller_id : conv.buyer_id;
    this.gateway.notifyUnreadUpdate(recipientId, (await this.getUnreadCount(recipientId)).unread);

    return saved;
  }

  async markAsRead(messageId: string, userId: string) {
    const msg = await this.msgRepo.findOne({ where: { id: messageId } });
    if (!msg) throw new NotFoundException("Mensaje no encontrado");

    const conv = await this.convRepo.findOne({ where: { id: msg.conversation_id } });
    if (!conv || (conv.buyer_id !== userId && conv.seller_id !== userId)) {
      throw new ForbiddenException("No tienes acceso");
    }

    if (!msg.read_at) {
      msg.read_at = new Date();
      await this.msgRepo.save(msg);
    }
    return msg;
  }

  async markAllAsRead(conversationId: string, userId: string) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException("Conversación no encontrada");
    if (conv.buyer_id !== userId && conv.seller_id !== userId) {
      throw new ForbiddenException("No tienes acceso");
    }

    const otherUserId = conv.buyer_id === userId ? conv.seller_id : conv.buyer_id;
    await this.msgRepo.query(
      `UPDATE messages SET read_at = NOW() WHERE conversation_id = $1 AND sender_id = $2 AND read_at IS NULL`,
      [conversationId, otherUserId]
    );

    return { message: "Mensajes marcados como leídos" };
  }

  async getUnreadCount(userId: string) {
    const result = await this.convRepo.query(
      `SELECT COUNT(*)::int AS count
       FROM messages m
       INNER JOIN conversations c ON c.id = m.conversation_id::uuid
       WHERE (c.buyer_id = $1 OR c.seller_id = $1)
        AND m.sender_id != $1
        AND m.read_at IS NULL`,
      [userId]
    );
    return { unread: result[0]?.count || 0 };
  }
}
