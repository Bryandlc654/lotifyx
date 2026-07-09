import { Controller, Get, Patch, Param, Query, Body, UseGuards } from "@nestjs/common";
import { FundsService } from "../checkout/funds.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/withdrawals")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminWithdrawalsController {
  constructor(private readonly fundsService: FundsService) {}

  @Get()
  @RequirePermission("orders.read")
  findAll(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.fundsService.findAllWithdrawals(page || 1, limit || 20);
  }

  @Patch(":id/approve")
  @RequirePermission("orders.approve")
  approve(@Param("id") id: string) {
    return this.fundsService.processWithdrawal(id, "approved");
  }

  @Patch(":id/reject")
  @RequirePermission("orders.approve")
  reject(@Param("id") id: string, @Body("motivo") motivo: string) {
    return this.fundsService.processWithdrawal(id, "rejected");
  }

  @Patch(":id/toggle-deposit")
  @RequirePermission("orders.approve")
  toggleDeposit(@Param("id") id: string) {
    return this.fundsService.toggleWithdrawalDeposit(id);
  }
}
