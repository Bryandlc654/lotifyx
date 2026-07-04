import { Controller, Get, Put, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { MailService } from "../mail/mail.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

const TOPBAR_KEYS = ["topbar_enabled", "topbar_interval", "topbar_font_size", "topbar_font_family", "topbar_messages", "topbar_text"];
const SMTP_KEYS = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass"];

@Controller("settings")
export class SettingsController {
  constructor(
    private readonly service: SettingsService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  getAll() { return this.service.getAll(); }

  @Get("topbar")
  getTopbar() { return this.service.getMany(TOPBAR_KEYS); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("settings.write")
  @Put()
  @HttpCode(HttpStatus.OK)
  async update(@Body() data: Record<string, string>) {
    const result = await this.service.setMany(data);
    const hasSmtp = Object.keys(data).some(k => SMTP_KEYS.includes(k));
    if (hasSmtp) await this.mailService.reloadTransporter();
    return result;
  }
}
