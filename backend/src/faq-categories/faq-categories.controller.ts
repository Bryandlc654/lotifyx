import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { FaqCategoriesService } from "./faq-categories.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("faq-categories")
export class FaqCategoriesController {
  constructor(private readonly service: FaqCategoriesService) {}

  @Get()
  findAll() { return this.service.findActive(); }

  @Get("admin")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("faq_categories.read")
  findAllAdmin() { return this.service.findAll(); }

  @Get(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("faq_categories.read")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("faq_categories.write")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) { return this.service.create(dto); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("faq_categories.write")
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  update(@Param("id") id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("faq_categories.delete")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
