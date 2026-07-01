import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { TutorialService } from "./tutorial.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller()
export class TutorialController {
  constructor(private readonly service: TutorialService) {}

  @Get("tutorials")
  findAllPublished() { return this.service.findAllPublished(); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("tutorials.read")
  @Get("admin/tutorials")
  findAllAdmin() { return this.service.findAllAdmin(); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("tutorials.read")
  @Get("admin/tutorials/:id")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("tutorials.write")
  @Post("admin/tutorials")
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) { return this.service.create(dto); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("tutorials.write")
  @Put("admin/tutorials/:id")
  @HttpCode(HttpStatus.OK)
  update(@Param("id") id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("tutorials.delete")
  @Delete("admin/tutorials/:id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
