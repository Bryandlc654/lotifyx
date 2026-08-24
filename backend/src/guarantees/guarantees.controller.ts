import { Controller, Get, Put, Delete, Body, Param, UseGuards, BadRequestException, NotFoundException } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

const CANALES = ["subasta_inversa", "demanda_agregada", "oferta"];

@Controller("admin/config/garantias")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GuaranteesController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @RequirePermission("config.umbrales")
  async list() {
    const rules = await this.dataSource.query(
      `SELECT gr.*, c.name AS categoria_nombre
       FROM guarantee_rules gr
       LEFT JOIN categories c ON c.id = gr.categoria_id
       ORDER BY gr.canal, categoria_id NULLS FIRST`,
    );
    const categorias = await this.dataSource.query(`SELECT id, name FROM categories ORDER BY name`);
    return { rules, categorias };
  }

  /** Crea o actualiza la regla de un canal (con o sin categoría específica) */
  @Put("regla")
  @RequirePermission("config.umbrales")
  async upsertRule(@Body() dto: {
    canal: string; categoria_id?: string | null;
    pct?: number | string | null; min_monto?: number | string | null;
    tope_monto?: number | string | null; redondeo?: number | string | null;
  }) {
    if (!CANALES.includes(dto.canal)) throw new BadRequestException("Canal inválido");
    const num = (v: any): number | null => (v === undefined || v === null || v === "" ? null : Number(v));
    const pct = num(dto.pct);
    if (pct !== null && (!Number.isFinite(pct) || pct < 0 || pct > 100)) throw new BadRequestException("El % debe estar entre 0 y 100");
    const min = num(dto.min_monto) ?? 0;
    if (!Number.isFinite(min) || min < 0) throw new BadRequestException("El mínimo no puede ser negativo");
    const tope = num(dto.tope_monto);
    if (tope !== null && (!Number.isFinite(tope) || tope < 0)) throw new BadRequestException("El tope no puede ser negativo");
    const redondeo = num(dto.redondeo);
    if (redondeo !== null && (!Number.isFinite(redondeo) || redondeo <= 0)) throw new BadRequestException("El redondeo debe ser mayor a cero");

    // Una regla activa por (canal, categoría): desactiva la previa y guarda la nueva
    if (dto.categoria_id) {
      await this.dataSource.query(
        `UPDATE guarantee_rules SET activo = FALSE, updated_at = NOW()
         WHERE canal = $1 AND categoria_id = $2::uuid`,
        [dto.canal, dto.categoria_id],
      );
      await this.dataSource.query(
        `INSERT INTO guarantee_rules (canal, categoria_id, pct, min_monto, tope_monto, redondeo)
         VALUES ($1, $2::uuid, $3, $4, $5, $6)`,
        [dto.canal, dto.categoria_id, pct, min, tope, redondeo ?? 0.01],
      );
    } else {
      await this.dataSource.query(
        `UPDATE guarantee_rules SET activo = FALSE, updated_at = NOW()
         WHERE canal = $1 AND categoria_id IS NULL`,
        [dto.canal],
      );
      await this.dataSource.query(
        `INSERT INTO guarantee_rules (canal, pct, min_monto, tope_monto, redondeo)
         VALUES ($1, $2, $3, $4, $5)`,
        [dto.canal, pct, min, tope, redondeo ?? 0.01],
      );
    }
    return { message: "Regla de garantía guardada" };
  }

  @Delete("regla/:id")
  @RequirePermission("config.umbrales")
  async deleteRule(@Param("id") id: string) {
    const res = await this.dataSource.query(
      `DELETE FROM guarantee_rules WHERE id = $1::uuid RETURNING id`,
      [id],
    );
    if (!res.length) throw new NotFoundException("Regla no encontrada");
    return { message: "Regla eliminada" };
  }
}
