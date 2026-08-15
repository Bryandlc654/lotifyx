import { Controller, Get, Put, Body, UseGuards, HttpCode, HttpStatus, BadRequestException } from "@nestjs/common";
import { ConfigService } from "../config/config.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/config/umbrales")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminConfigController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  @RequirePermission("config.umbrales")
  async get() {
    const all = await this.config.getAll();
    return {
      garantia_subasta_inversa_pct: all.garantia_subasta_inversa_pct ?? 5,
      garantia_demanda_agregada_pct: all.garantia_demanda_agregada_pct ?? 5,
    };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @RequirePermission("config.umbrales")
  async update(@Body() dto: { garantia_subasta_inversa_pct?: number; garantia_demanda_agregada_pct?: number }) {
    const keys = ["garantia_subasta_inversa_pct", "garantia_demanda_agregada_pct"] as const;
    for (const key of keys) {
      const value = dto[key];
      if (value === undefined || value === null) continue;
      if (!Number.isFinite(Number(value)) || Number(value) <= 0 || Number(value) > 100) {
        throw new BadRequestException(`${key} debe ser un porcentaje entre 1 y 100`);
      }
      await this.config.setPct(key, Number(value));
    }
    const all = await this.config.getAll();
    return {
      garantia_subasta_inversa_pct: all.garantia_subasta_inversa_pct ?? 5,
      garantia_demanda_agregada_pct: all.garantia_demanda_agregada_pct ?? 5,
    };
  }
}
