import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { EventsService } from "./events.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller()
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get("events")
  findAllPublished() { return this.service.findAllPublished(); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("events.read")
  @Get("admin/events")
  findAllAdmin() { return this.service.findAllAdmin(); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("events.read")
  @Get("admin/events/:id")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("events.write")
  @Post("admin/events")
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) { return this.service.create(dto); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("events.write")
  @Put("admin/events/:id")
  @HttpCode(HttpStatus.OK)
  update(@Param("id") id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("events.delete")
  @Delete("admin/events/:id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
