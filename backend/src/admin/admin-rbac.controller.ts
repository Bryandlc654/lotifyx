import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { AdminRbacService } from "./admin-rbac.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("admin/rbac")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("superadmin")
export class AdminRbacController {
  constructor(private readonly service: AdminRbacService) {}

  @Get("roles")
  getRoles() { return this.service.getRoles(); }

  @Post("roles")
  @HttpCode(HttpStatus.CREATED)
  createRole(@Body() dto: any) { return this.service.createRole(dto); }

  @Delete("roles/:id")
  deleteRole(@Param("id") id: string) { return this.service.deleteRole(id); }

  @Get("permissions")
  getPermissions() { return this.service.getPermissions(); }

  @Post("permissions")
  @HttpCode(HttpStatus.CREATED)
  createPermission(@Body() dto: any) { return this.service.createPermission(dto); }

  @Delete("permissions/:id")
  deletePermission(@Param("id") id: string) { return this.service.deletePermission(id); }

  @Get("roles/:roleId/permissions")
  getRolePermissions(@Param("roleId") roleId: string) { return this.service.getRolePermissions(roleId); }

  @Post("roles/:roleId/permissions")
  @HttpCode(HttpStatus.CREATED)
  assignPermission(@Param("roleId") roleId: string, @Body("permission_id") permId: string) {
    return this.service.assignPermission(roleId, permId);
  }

  @Delete("permissions/:id/revoke")
  revokePermission(@Param("id") id: string) { return this.service.revokePermission(id); }

  @Post("seed")
  @HttpCode(HttpStatus.OK)
  seed() { return this.service.seedDefaultPermissions(); }
}
