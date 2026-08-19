import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { RequestsService } from "../requests/requests.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/requests")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminRequestsController {
  constructor(private readonly service: RequestsService) {}

  @Get()
  @RequirePermission("orders.read")
  findAll(
    @Query("estado") estado?: string,
    @Query("q") q?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.service.findAllAdmin(estado || undefined, q || undefined, page || 1, limit || 20);
  }

  @Get(":id/offers")
  @RequirePermission("orders.read")
  findOffers(@Param("id") id: string) {
    return this.service.findOffersAdmin(id);
  }
}
