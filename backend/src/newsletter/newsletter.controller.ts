import { Controller, Get, Post, Delete, Param, Body, Res, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { NewsletterService } from "./newsletter.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller()
export class NewsletterController {
  constructor(private readonly service: NewsletterService) {}

  @Post("newsletter/subscribe")
  @HttpCode(HttpStatus.CREATED)
  subscribe(@Body() body: { name?: string; email: string }) {
    return this.service.subscribe(body.name, body.email);
  }

  @Post("newsletter/unsubscribe")
  @HttpCode(HttpStatus.OK)
  unsubscribe(@Body() body: { email: string }) {
    return this.service.unsubscribeByEmail(body.email);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("newsletter.read")
  @Get("admin/newsletter")
  findAll() { return this.service.findAll(); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("newsletter.read")
  @Delete("admin/newsletter/:id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("newsletter.read")
  @Get("admin/newsletter/export")
  async exportCsv(@Res() res: Response) {
    const subs = await this.service.findAll();
    const header = "Nombre,Email,Estado,Fecha\n";
    const rows = subs.map(s => {
      const name = (s.name || "").replace(/,/g, " ");
      const status = s.is_active ? "Activo" : "Inactivo";
      const date = new Date(s.created_at).toISOString().split("T")[0];
      return `${name},${s.email},${status},${date}`;
    }).join("\n");
    const csv = "\uFEFF" + header + rows;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=suscriptores-newsletter.csv");
    res.send(csv);
  }
}
