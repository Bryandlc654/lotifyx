import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { AdminUsersService } from "./admin-users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  @RequirePermission("users.read")
  findAll(@Query() q: any) { return this.service.findAll(q); }

  @Get("roles")
  @RequirePermission("users.read")
  getRoles() { return this.service.getRoles(); }

  @Get(":id")
  @RequirePermission("users.read")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @Post()
  @RequirePermission("users.write")
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) { return this.service.create(dto); }

  @Put(":id")
  @RequirePermission("users.write")
  @HttpCode(HttpStatus.OK)
  update(@Param("id") id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(":id")
  @RequirePermission("users.delete")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
