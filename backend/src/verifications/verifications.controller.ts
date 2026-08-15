import { Controller, Get, Post, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { VerificationsService } from "./verifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("products/:productId/verification")
@UseGuards(JwtAuthGuard)
export class VerificationsController {
  constructor(private readonly service: VerificationsService) {}

  @Get()
  get(@Param("productId") productId: string, @Req() req) {
    return this.service.getByProduct(productId, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  submit(@Param("productId") productId: string, @Body() dto: any, @Req() req) {
    return this.service.submit(productId, req.user.id, dto);
  }
}
