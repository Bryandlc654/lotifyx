import { Controller, Get, Put, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("settings")
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  getAll() { return this.service.getAll(); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("superadmin")
  @Put()
  @HttpCode(HttpStatus.OK)
  update(@Body() data: Record<string, string>) {
    return this.service.setMany(data);
  }
}
