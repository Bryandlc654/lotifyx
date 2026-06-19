import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { CategoryFieldsService } from "./category-fields.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("category-fields")
export class CategoryFieldsController {
  constructor(private readonly service: CategoryFieldsService) {}

  @Get()
  findByCategory(@Query("category_id") categoryId?: string) {
    if (categoryId) return this.service.findByCategory(categoryId);
    return this.service.findAll();
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("category_fields.read")
  findAllAdmin() { return this.service.findAll(); }

  @Get(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("category_fields.read")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("category_fields.write")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) { return this.service.create(dto); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("category_fields.write")
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  update(@Param("id") id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("category_fields.delete")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
