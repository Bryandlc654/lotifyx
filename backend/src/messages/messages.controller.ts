import { Controller, Get, Post, Put, Param, Body, UseGuards, HttpCode, HttpStatus, Req } from "@nestjs/common";
import { MessagesService } from "./messages.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller()
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @Post("messages/conversations")
  @HttpCode(HttpStatus.OK)
  async createConversation(@Req() req, @Body() dto: { seller_id: string; product_id?: string }) {
    return this.service.createOrGetConversation(req.user.id, dto.seller_id, dto.product_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("messages/conversations")
  async getConversations(@Req() req) {
    return this.service.getConversations(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("messages/conversations/:id")
  async getMessages(@Req() req, @Param("id") id: string) {
    return this.service.getMessages(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("messages/conversations/:id/messages")
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(@Req() req, @Param("id") id: string, @Body() dto: { text: string }) {
    return this.service.sendMessage(id, req.user.id, dto.text);
  }

  @UseGuards(JwtAuthGuard)
  @Get("messages/unread-count")
  async getUnreadCount(@Req() req) {
    return this.service.getUnreadCount(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put("messages/:id/read")
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Req() req, @Param("id") id: string) {
    return this.service.markAsRead(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put("messages/conversations/:id/read-all")
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req, @Param("id") id: string) {
    return this.service.markAllAsRead(id, req.user.id);
  }
}
