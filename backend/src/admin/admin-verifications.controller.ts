import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { VerificationsService } from "../verifications/verifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/verifications")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminVerificationsController {
  constructor(private readonly service: VerificationsService) {}

  @Get()
  @RequirePermission("verifications.read")
  findAll(@Query("estado") estado?: string) {
    return this.service.listForAdmin(estado);
  }

  @Post(":id/approve")
  @HttpCode(HttpStatus.OK)
  @RequirePermission("verifications.approve")
  approve(@Param("id") id: string, @Body() dto: any, @Req() req) {
    return this.service.approve(id, req.user.id, dto?.observaciones);
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  @RequirePermission("verifications.approve")
  reject(@Param("id") id: string, @Body() dto: any, @Req() req) {
    return this.service.reject(id, req.user.id, dto?.observaciones);
  }
}
