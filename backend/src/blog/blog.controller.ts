import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { BlogService } from "./blog.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller()
export class BlogController {
  constructor(private readonly service: BlogService) {}

  @Get("blog")
  findAllPublished() { return this.service.findAllPublished(); }

  @Get("blog/:slug")
  findBySlug(@Param("slug") slug: string) { return this.service.findBySlug(slug); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("blog.write")
  @Get("admin/blog")
  findAllAdmin() { return this.service.findAllAdmin(); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("blog.write")
  @Get("admin/blog/:id")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("blog.write")
  @Post("admin/blog")
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) { return this.service.create(dto); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("blog.write")
  @Put("admin/blog/:id")
  @HttpCode(HttpStatus.OK)
  update(@Param("id") id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("blog.write")
  @Delete("admin/blog/:id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
