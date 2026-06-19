import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { FaqsService } from "./faqs.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("faqs")
export class FaqsController {
  constructor(private readonly service: FaqsService) {}

  @Get()
  findAll(@Query("category") category?: string) { return this.service.findAll(category); }

  @Get("admin")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("faqs.read")
  findAllAdmin() { return this.service.findAllAdmin(); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("faqs.write")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) { return this.service.create(dto); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("faqs.write")
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  update(@Param("id") id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("faqs.delete")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
