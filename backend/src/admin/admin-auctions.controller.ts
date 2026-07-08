import { Controller, Post, Param, Get, UseGuards } from "@nestjs/common";
import { AuctionsService } from "../auctions/auctions.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/auctions")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminAuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Get()
  @RequirePermission("auctions.manage")
  findAll() {
    return this.auctionsService.findActive();
  }

  @Get("ended")
  @RequirePermission("auctions.manage")
  findEnded() {
    return this.auctionsService.findEnded();
  }

  @Post(":id/close")
  @RequirePermission("auctions.manage")
  close(@Param("id") id: string) {
    return this.auctionsService.closeSingle(id);
  }
}
