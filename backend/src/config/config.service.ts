import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppConfig } from "./app-config.entity";

export const UMBRALES = {
  garantia_subasta_inversa_pct: 5,
  garantia_demanda_agregada_pct: 5,
  limite_pago_dias: 3,
  max_incumplimientos: 2,
  sancion_dias: 7,
  garantia_oferta_pct: 1,
  max_ofertas_pendientes: 10,
  max_pujas_pendientes: 5,
  reconexion_dias: 3,
  session_timeout_minutos: 120,
  max_login_intentos: 5,
  bloqueo_login_minutos: 15,
} as const;

export type UmbralesKeys = keyof typeof UMBRALES;

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(AppConfig)
    private readonly repo: Repository<AppConfig>,
  ) {}

  async getNum(key: UmbralesKeys): Promise<number> {
    const row = await this.repo.findOne({ where: { key } });
    if (!row) return UMBRALES[key];
    const n = Number(row.value);
    return Number.isFinite(n) && n > 0 ? n : UMBRALES[key];
  }

  async getPct(key: UmbralesKeys): Promise<number> {
    return this.getNum(key);
  }

  async getAll(): Promise<Record<string, number>> {
    const rows = await this.repo.find();
    const map: Record<string, number> = {};
    for (const row of rows) map[row.key] = Number(row.value) || UMBRALES[row.key as UmbralesKeys] || 0;
    return map;
  }

  async setPct(key: UmbralesKeys, value: number) {
    await this.repo.upsert({ key, value: String(value) }, ["key"]);
    return value;
  }
}
