import { Controller, Get, Patch, Param, Query, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { CollusionService } from "../collusion/collusion.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/collusion")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminCollusionController {
  constructor(private readonly service: CollusionService) {}

  @Get()
  @RequirePermission("orders.read")
  list(@Query("status") status?: string) {
    return this.service.listFlags(status || undefined);
  }

  @Get("users")
  @RequirePermission("orders.read")
  flaggedUsers() {
    return this.service.listFlaggedUsers();
  }

  @Get("sancionados")
  @RequirePermission("orders.read")
  sancionados() {
    return this.service.listSanctioned();
  }

  @Patch(":id/resolve")
  @HttpCode(HttpStatus.OK)
  @RequirePermission("orders.approve")
  resolve(@Param("id") id: string) {
    return this.service.resolveFlag(id);
  }

  @Patch("users/:userId/clear")
  @HttpCode(HttpStatus.OK)
  @RequirePermission("orders.approve")
  clearUser(@Param("userId") userId: string) {
    return this.service.clearUserFlag(userId);
  }

  @Patch("sancionados/:userId/clear")
  @HttpCode(HttpStatus.OK)
  @RequirePermission("orders.approve")
  clearSanction(@Param("userId") userId: string) {
    return this.service.clearSanction(userId);
  }
}
