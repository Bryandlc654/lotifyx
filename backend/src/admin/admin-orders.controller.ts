import { Controller, Get, Patch, Post, Param, Query, Body, Req, UseGuards, BadRequestException } from "@nestjs/common";
import { CheckoutService } from "../checkout/checkout.service";
import { OrdersService } from "../checkout/orders.service";
import { ClaimsService } from "../checkout/claims.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/orders")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminOrdersController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly ordersService: OrdersService,
    private readonly claimsService: ClaimsService,
  ) {}

  @Get()
  @RequirePermission("orders.read")
  findAll(
    @Query("status") status?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.ordersService.findAllOrders(status, page || 1, limit || 20);
  }

  @Patch(":id/approve")
  @RequirePermission("orders.approve")
  approve(@Req() req, @Param("id") id: string) {
    return this.checkoutService.approveOrder(id, req.user.id);
  }

  @Patch(":id/reject")
  @RequirePermission("orders.approve")
  reject(@Req() req, @Param("id") id: string, @Body("motivo") motivo: string) {
    return this.checkoutService.rejectOrder(id, motivo || "Sin motivo especificado", req.user.id);
  }

  /** Devolución administrativa con registro de motivo */
  @Post(":id/refund")
  @RequirePermission("orders.approve")
  refund(@Req() req, @Param("id") id: string, @Body("motivo") motivo: string) {
    if (!motivo?.trim()) throw new BadRequestException("El motivo de la devolución es obligatorio");
    return this.checkoutService.refundOrder(id, req.user.id, motivo);
  }

  @Patch(":id/status")
  @RequirePermission("orders.approve")
  updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.checkoutService.updateOrderStatus(id, status);
  }

  /** Cancelación administrativa: obligatoria a partir de "En preparación" */
  @Patch(":id/cancel")
  @RequirePermission("orders.approve")
  cancel(@Param("id") id: string, @Req() req, @Body("motivo") motivo: string) {
    return this.checkoutService.cancelOrder(req.user.id, id, motivo || "Cancelado por el Administrador", true);
  }

  @Get("claims")
  @RequirePermission("orders.read")
  findClaims() {
    return this.claimsService.findAllClaims();
  }

  @Patch("claims/:id")
  @RequirePermission("orders.approve")
  updateClaim(@Param("id") id: string, @Body("status") status: string) {
    return this.claimsService.updateClaimStatus(id, status);
  }
}
