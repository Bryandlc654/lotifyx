import { Controller, Get, Patch, Param, Query, Body, UseGuards } from "@nestjs/common";
import { CheckoutService } from "../checkout/checkout.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/orders")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminOrdersController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get()
  @RequirePermission("orders.read")
  findAll(
    @Query("status") status?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.checkoutService.findAllOrders(status, page || 1, limit || 20);
  }

  @Patch(":id/approve")
  @RequirePermission("orders.approve")
  approve(@Param("id") id: string) {
    return this.checkoutService.approveOrder(id);
  }

  @Patch(":id/reject")
  @RequirePermission("orders.approve")
  reject(@Param("id") id: string, @Body("motivo") motivo: string) {
    return this.checkoutService.rejectOrder(id, motivo || "Sin motivo especificado");
  }

  @Patch(":id/status")
  @RequirePermission("orders.approve")
  updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.checkoutService.updateOrderStatus(id, status);
  }

  @Get("claims")
  @RequirePermission("orders.read")
  findClaims() {
    return this.checkoutService.findAllClaims();
  }

  @Patch("claims/:id")
  @RequirePermission("orders.approve")
  updateClaim(@Param("id") id: string, @Body("status") status: string) {
    return this.checkoutService.updateClaimStatus(id, status);
  }
}
