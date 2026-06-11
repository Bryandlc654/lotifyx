import { Controller, Get, Put, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("settings")
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  getAll() { return this.service.getAll(); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("settings.write")
  @Put()
  @HttpCode(HttpStatus.OK)
  update(@Body() data: Record<string, string>) {
    return this.service.setMany(data);
  }
}
