import { Controller, Get, Post, Param, Body, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { AuctionsService } from "./auctions.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("auctions")
export class AuctionsController {
  constructor(private readonly service: AuctionsService) {}

  @Get("active")
  findActive() { return this.service.findActive(); }

  @Get("ended")
  findEnded() { return this.service.findEnded(); }

  @Get("product/:productId")
  findByProduct(@Param("productId") productId: string) { return this.service.findByProduct(productId); }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req, @Body() dto: any) {
    return this.service.create({ ...dto, vendedor_id: req.user.id });
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/bid")
  @HttpCode(HttpStatus.CREATED)
  placeBid(@Req() req, @Param("id") id: string, @Body("monto") monto: number) {
    return this.service.placeBid(id, req.user.id, monto);
  }

  @Get(":id/bids")
  getBids(@Param("id") id: string) { return this.service.getBids(id); }
}
