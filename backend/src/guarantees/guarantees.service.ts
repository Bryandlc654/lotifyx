import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { ConfigService } from "../config/config.service";

export type Canal = "subasta_inversa" | "demanda_agregada" | "oferta";

export interface CalculoGarantia {
  monto: number;
  pct_aplicado: number;
  fuente: string;
  detalle: { base: number; min?: number; tope?: number; redondeo?: number };
}

/**
 * Cálculo de garantías por canal y categoría usando fórmula, mínimo, tope y redondeo:
 *   monto = base × pct / 100  →  se aplica mínimo → tope → redondeo (hacia arriba)
 * La regla específica de la categoría tiene prioridad sobre la regla general del canal,
 * y esta sobre los umbrales globales.
 */
@Injectable()
export class GuaranteesService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  private async umbralPorCanal(canal: Canal): Promise<number> {
    if (canal === "subasta_inversa") return this.config.getPct("garantia_subasta_inversa_pct");
    if (canal === "demanda_agregada") return this.config.getPct("garantia_demanda_agregada_pct");
    return this.config.getPct("garantia_oferta_pct");
  }

  private num(v: any): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  /** Redondea hacia arriba al múltiplo más cercano del paso indicado */
  private aplicarRedondeo(monto: number, paso: number): number {
    if (!paso || paso <= 0) return Math.round(monto * 100) / 100;
    return Math.ceil(monto / paso) * paso;
  }

  async calcular(params: { canal: Canal; categoriaId?: string | null; base: number; pctOverride?: number | null }): Promise<CalculoGarantia> {
    const { canal, categoriaId, base } = params;
    if (!Number.isFinite(base) || base <= 0) throw new Error("Base inválida para calcular garantía");

    // 1) Regla específica de la categoría; si no existe, la general del canal
    let rule: any = null;
    let fuente = "umbral";
    if (categoriaId) {
      [rule] = await this.dataSource.query(
        `SELECT * FROM guarantee_rules WHERE canal = $1 AND categoria_id = $2::uuid AND activo = TRUE LIMIT 1`,
        [canal, categoriaId],
      );
      if (rule) fuente = "regla_categoria";
    }
    if (!rule) {
      [rule] = await this.dataSource.query(
        `SELECT * FROM guarantee_rules WHERE canal = $1 AND categoria_id IS NULL AND activo = TRUE LIMIT 1`,
        [canal],
      );
      if (rule) fuente = "regla_canal";
    }

    // 2) Porcentaje: override explícito > regla > umbral global del canal
    let pct = params.pctOverride ?? this.num(rule?.pct);
    if (pct == null) pct = await this.umbralPorCanal(canal);

    // 3) Fórmula con mínimo, tope y redondeo (de la regla o de Umbrales)
    const min = this.num(rule?.min_monto) ?? (await this.config.getNum("garantia_min_monto"));
    let tope = this.num(rule?.tope_monto);
    if (tope == null || tope <= 0) {
      const topeGlobal = await this.config.getNum("garantia_tope_monto");
      tope = topeGlobal > 0 ? topeGlobal : null;
    }
    const redondeo = this.num(rule?.redondeo) ?? (await this.config.getNum("garantia_redondeo_monto")) ?? 0.01;

    let monto = (base * Number(pct)) / 100;
    if (monto < min) monto = min;
    if (tope && monto > tope) monto = tope;
    monto = this.aplicarRedondeo(monto, redondeo);
    if (monto > base) monto = base; // la garantía nunca supera el precio adjudicado
    monto = Math.round(monto * 100) / 100;

    return { monto, pct_aplicado: Number(pct), fuente, detalle: { base, min, tope: tope ?? undefined, redondeo } };
  }
}
