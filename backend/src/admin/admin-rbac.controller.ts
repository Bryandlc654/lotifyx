import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { AdminRbacService } from "./admin-rbac.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/rbac")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminRbacController {
  constructor(private readonly service: AdminRbacService) {}

  @Get("roles")
  @RequirePermission("rbac.read")
  getRoles() { return this.service.getRoles(); }

  @Post("roles")
  @RequirePermission("rbac.write")
  @HttpCode(HttpStatus.CREATED)
  createRole(@Body() dto: any) { return this.service.createRole(dto); }

  @Delete("roles/:id")
  @RequirePermission("rbac.write")
  deleteRole(@Param("id") id: string) { return this.service.deleteRole(id); }

  @Get("permissions")
  @RequirePermission("rbac.read")
  getPermissions() { return this.service.getPermissions(); }

  @Post("permissions")
  @RequirePermission("rbac.write")
  @HttpCode(HttpStatus.CREATED)
  createPermission(@Body() dto: any) { return this.service.createPermission(dto); }

  @Delete("permissions/:id")
  @RequirePermission("rbac.write")
  deletePermission(@Param("id") id: string) { return this.service.deletePermission(id); }

  @Get("roles/:roleId/permissions")
  @RequirePermission("rbac.read")
  getRolePermissions(@Param("roleId") roleId: string) { return this.service.getRolePermissions(roleId); }

  @Post("roles/:roleId/permissions")
  @RequirePermission("rbac.write")
  @HttpCode(HttpStatus.CREATED)
  assignPermission(@Param("roleId") roleId: string, @Body("permission_id") permId: string) {
    return this.service.assignPermission(roleId, permId);
  }

  @Delete("permissions/:id/revoke")
  @RequirePermission("rbac.write")
  revokePermission(@Param("id") id: string) { return this.service.revokePermission(id); }

  @Post("seed")
  @RequirePermission("rbac.write")
  @HttpCode(HttpStatus.OK)
  seed() { return this.service.seedDefaultPermissions(); }
}
