import { Controller, Get, Post, Param, Body, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { LotsService } from "./lots.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("lots")
export class LotsController {
  constructor(private readonly service: LotsService) {}

  @Get("open")
  findOpen() { return this.service.findOpen(); }

  @Get("product/:productId")
  findByProduct(@Param("productId") productId: string) { return this.service.findByProduct(productId); }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req, @Body() dto: any) {
    return this.service.create({ ...dto, vendedor_id: req.user.id });
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/join")
  @HttpCode(HttpStatus.OK)
  join(@Req() req, @Param("id") id: string, @Body("cantidad") cantidad?: number) {
    return this.service.join(id, req.user.id, cantidad || 1);
  }

  @Get(":id/participants")
  getParticipants(@Param("id") id: string) { return this.service.getParticipants(id); }
}
