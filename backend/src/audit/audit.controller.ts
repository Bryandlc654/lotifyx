import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/audit")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermission("orders.read")
  findAll(@Query("action") action?: string, @Query("entity") entity?: string) {
    return this.auditService.findAll({ action, entity });
  }
}
