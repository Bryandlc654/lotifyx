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
      limite_pago_dias: all.limite_pago_dias ?? 3,
      limite_pago_normal_dias: all.limite_pago_normal_dias ?? 3,
      limite_pago_subasta_dias: all.limite_pago_subasta_dias ?? 2,
      limite_pago_lote_garantia_dias: all.limite_pago_lote_garantia_dias ?? 2,
      limite_pago_lote_saldo_dias: all.limite_pago_lote_saldo_dias ?? 5,
      max_incumplimientos: all.max_incumplimientos ?? 2,
      sancion_dias: all.sancion_dias ?? 7,
      garantia_oferta_pct: all.garantia_oferta_pct ?? 1,
      max_ofertas_pendientes: all.max_ofertas_pendientes ?? 10,
      max_pujas_pendientes: all.max_pujas_pendientes ?? 5,
      reconexion_dias: all.reconexion_dias ?? 3,
      session_timeout_minutos: all.session_timeout_minutos ?? 120,
      max_login_intentos: all.max_login_intentos ?? 5,
      bloqueo_login_minutos: all.bloqueo_login_minutos ?? 15,
    };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @RequirePermission("config.umbrales")
  async update(@Body() dto: {
    garantia_subasta_inversa_pct?: number; garantia_demanda_agregada_pct?: number;
    limite_pago_dias?: number; limite_pago_normal_dias?: number; limite_pago_subasta_dias?: number;
    limite_pago_lote_garantia_dias?: number; limite_pago_lote_saldo_dias?: number;
    max_incumplimientos?: number; sancion_dias?: number;
    garantia_oferta_pct?: number; max_ofertas_pendientes?: number; max_pujas_pendientes?: number; reconexion_dias?: number;
    session_timeout_minutos?: number; max_login_intentos?: number; bloqueo_login_minutos?: number;
  }) {
    if (dto.garantia_subasta_inversa_pct !== undefined && dto.garantia_subasta_inversa_pct !== null) {
      const v = Number(dto.garantia_subasta_inversa_pct);
      if (!Number.isFinite(v) || v <= 0 || v > 100) throw new BadRequestException("garantia_subasta_inversa_pct debe ser un porcentaje entre 1 y 100");
      await this.config.setPct("garantia_subasta_inversa_pct", v);
    }
    if (dto.garantia_demanda_agregada_pct !== undefined && dto.garantia_demanda_agregada_pct !== null) {
      const v = Number(dto.garantia_demanda_agregada_pct);
      if (!Number.isFinite(v) || v <= 0 || v > 100) throw new BadRequestException("garantia_demanda_agregada_pct debe ser un porcentaje entre 1 y 100");
      await this.config.setPct("garantia_demanda_agregada_pct", v);
    }
    if (dto.limite_pago_dias !== undefined && dto.limite_pago_dias !== null) {
      const v = Number(dto.limite_pago_dias);
      if (!Number.isFinite(v) || v <= 0 || v > 90) throw new BadRequestException("limite_pago_dias debe ser un número entre 1 y 90");
      await this.config.setPct("limite_pago_dias", v);
    }
    for (const [key, min] of [
      ["limite_pago_normal_dias", 1], ["limite_pago_subasta_dias", 1],
      ["limite_pago_lote_garantia_dias", 1], ["limite_pago_lote_saldo_dias", 1],
    ] as const) {
      const raw = (dto as any)[key];
      if (raw !== undefined && raw !== null) {
        const v = Number(raw);
        if (!Number.isFinite(v) || v < min || v > 90) throw new BadRequestException(`${key} debe ser un número entre ${min} y 90`);
        await this.config.setPct(key as any, v);
      }
    }
    if (dto.max_incumplimientos !== undefined && dto.max_incumplimientos !== null) {
      const v = Number(dto.max_incumplimientos);
      if (!Number.isFinite(v) || v <= 0 || v > 20) throw new BadRequestException("max_incumplimientos debe ser un número entre 1 y 20");
      await this.config.setPct("max_incumplimientos", v);
    }
    if (dto.sancion_dias !== undefined && dto.sancion_dias !== null) {
      const v = Number(dto.sancion_dias);
      if (!Number.isFinite(v) || v <= 0 || v > 365) throw new BadRequestException("sancion_dias debe ser un número entre 1 y 365");
      await this.config.setPct("sancion_dias", v);
    }
    if (dto.garantia_oferta_pct !== undefined && dto.garantia_oferta_pct !== null) {
      const v = Number(dto.garantia_oferta_pct);
      if (!Number.isFinite(v) || v < 0 || v > 100) throw new BadRequestException("garantia_oferta_pct debe ser un número entre 0 y 100");
      await this.config.setPct("garantia_oferta_pct", v);
    }
    if (dto.max_ofertas_pendientes !== undefined && dto.max_ofertas_pendientes !== null) {
      const v = Number(dto.max_ofertas_pendientes);
      if (!Number.isFinite(v) || v <= 0 || v > 100) throw new BadRequestException("max_ofertas_pendientes debe ser un número entre 1 y 100");
      await this.config.setPct("max_ofertas_pendientes", v);
    }
    if (dto.max_pujas_pendientes !== undefined && dto.max_pujas_pendientes !== null) {
      const v = Number(dto.max_pujas_pendientes);
      if (!Number.isFinite(v) || v <= 0 || v > 50) throw new BadRequestException("max_pujas_pendientes debe ser un número entre 1 y 50");
      await this.config.setPct("max_pujas_pendientes", v);
    }
    if (dto.reconexion_dias !== undefined && dto.reconexion_dias !== null) {
      const v = Number(dto.reconexion_dias);
      if (!Number.isFinite(v) || v <= 0 || v > 30) throw new BadRequestException("reconexion_dias debe ser un número entre 1 y 30");
      await this.config.setPct("reconexion_dias", v);
    }
    if (dto.session_timeout_minutos !== undefined && dto.session_timeout_minutos !== null) {
      const v = Number(dto.session_timeout_minutos);
      if (!Number.isFinite(v) || v < 1 || v > 1440) throw new BadRequestException("session_timeout_minutos debe ser un número entre 1 y 1440");
      await this.config.setPct("session_timeout_minutos", v);
    }
    if (dto.max_login_intentos !== undefined && dto.max_login_intentos !== null) {
      const v = Number(dto.max_login_intentos);
      if (!Number.isFinite(v) || v <= 0 || v > 20) throw new BadRequestException("max_login_intentos debe ser un número entre 1 y 20");
      await this.config.setPct("max_login_intentos", v);
    }
    if (dto.bloqueo_login_minutos !== undefined && dto.bloqueo_login_minutos !== null) {
      const v = Number(dto.bloqueo_login_minutos);
      if (!Number.isFinite(v) || v <= 0 || v > 1440) throw new BadRequestException("bloqueo_login_minutos debe ser un número entre 1 y 1440");
      await this.config.setPct("bloqueo_login_minutos", v);
    }
    const all = await this.config.getAll();
    return {
      garantia_subasta_inversa_pct: all.garantia_subasta_inversa_pct ?? 5,
      garantia_demanda_agregada_pct: all.garantia_demanda_agregada_pct ?? 5,
      limite_pago_dias: all.limite_pago_dias ?? 3,
      limite_pago_normal_dias: all.limite_pago_normal_dias ?? 3,
      limite_pago_subasta_dias: all.limite_pago_subasta_dias ?? 2,
      limite_pago_lote_garantia_dias: all.limite_pago_lote_garantia_dias ?? 2,
      limite_pago_lote_saldo_dias: all.limite_pago_lote_saldo_dias ?? 5,
      max_incumplimientos: all.max_incumplimientos ?? 2,
      sancion_dias: all.sancion_dias ?? 7,
      garantia_oferta_pct: all.garantia_oferta_pct ?? 1,
      max_ofertas_pendientes: all.max_ofertas_pendientes ?? 10,
      max_pujas_pendientes: all.max_pujas_pendientes ?? 5,
      reconexion_dias: all.reconexion_dias ?? 3,
      session_timeout_minutos: all.session_timeout_minutos ?? 120,
      max_login_intentos: all.max_login_intentos ?? 5,
      bloqueo_login_minutos: all.bloqueo_login_minutos ?? 15,
    };
  }
}
