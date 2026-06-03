import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { AdminUsersService } from "./admin-users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("superadmin")
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  findAll(@Query() q: any) { return this.service.findAll(q); }

  @Get("roles")
  getRoles() { return this.service.getRoles(); }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) { return this.service.create(dto); }

  @Put(":id")
  @HttpCode(HttpStatus.OK)
  update(@Param("id") id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
