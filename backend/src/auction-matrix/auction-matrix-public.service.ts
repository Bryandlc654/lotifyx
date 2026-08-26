import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class AuctionMatrixPublicService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Devuelve las reglas activas para un canal (público, sin auth) */
  async reglasPorCanal(canal: string): Promise<{ modalidades: string[]; divisibilidad: string; actores: string[] }> {
    const rules = await this.dataSource.query(
      `SELECT modalidad, divisibilidad_requerida, actores_permitidos
       FROM auction_matrix_rules
       WHERE canal = $1 AND activo = TRUE`,
      [canal],
    );
    if (rules.length === 0) {
      return { modalidades: [], divisibilidad: "cualquiera", actores: [] };
    }
    const modalidades = [...new Set(rules.map((r: any) => r.modalidad).filter(Boolean))] as string[];
    const divisibilidades = rules.map((r: any) => r.divisibilidad_requerida).filter((v: any) => v !== null);
    const actores = [...new Set(rules.map((r: any) => r.actores_permitidos))] as string[];
    return {
      modalidades: modalidades.length > 0 ? modalidades : ["inglesa", "sobre_cerrado"],
      divisibilidad: divisibilidades.length === 1 ? (divisibilidades[0] ? "requerida" : "prohibida") : "cualquiera",
      actores,
    };
  }
}
