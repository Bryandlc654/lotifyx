import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AuditService } from "../audit/audit.service";

export interface MatrizValidationInput {
  canal: string;
  modalidad?: string | null;
  categoria_id?: string | null;
  divisible?: boolean;
  actor_tipo?: string;
}

@Injectable()
export class AuctionMatrixService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

  async findAll(activo?: boolean): Promise<any[]> {
    const where = activo !== undefined ? "WHERE activo = $1" : "";
    const params = activo !== undefined ? [activo] : [];
    return this.dataSource.query(
      `SELECT r.*, c.name AS categoria_nombre
       FROM auction_matrix_rules r
       LEFT JOIN categories c ON c.id = r.categoria_id
       ${where}
       ORDER BY r.canal, r.modalidad, r.categoria_id`,
      params,
    );
  }

  async findOne(id: string): Promise<any> {
    const [row] = await this.dataSource.query(
      `SELECT r.*, c.name AS categoria_nombre
       FROM auction_matrix_rules r
       LEFT JOIN categories c ON c.id = r.categoria_id
       WHERE r.id = $1`,
      [id],
    );
    return row || null;
  }

  async create(dto: {
    canal: string;
    modalidad?: string | null;
    categoria_id?: string | null;
    divisibilidad_requerida?: boolean | null;
    actores_permitidos?: string;
    actorId?: string;
  }): Promise<any> {
    const validCanales = ["subasta", "demanda_agregada", "subasta_inversa", "oferta"];
    if (!validCanales.includes(dto.canal)) {
      throw new BadRequestException(`Canal inválido. Valores permitidos: ${validCanales.join(", ")}`);
    }
    const validActores = ["todos", "comprador_verificado", "empresa", "premium"];
    const actores = dto.actores_permitidos || "todos";
    if (!validActores.includes(actores)) {
      throw new BadRequestException(`Actores inválidos. Valores permitidos: ${validActores.join(", ")}`);
    }

    const [row] = await this.dataSource.query(
      `INSERT INTO auction_matrix_rules (canal, modalidad, categoria_id, divisibilidad_requerida, actores_permitidos)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [dto.canal, dto.modalidad || null, dto.categoria_id || null, dto.divisibilidad_requerida ?? null, actores],
    );

    if (dto.actorId) {
      this.audit.log({
        userId: dto.actorId,
        action: "matrix_rule_created",
        entity: "auction_matrix_rule",
        entityId: row.id,
        details: { canal: dto.canal, modalidad: dto.modalidad, categoria_id: dto.categoria_id },
      });
    }

    return row;
  }

  async update(id: string, dto: {
    canal?: string;
    modalidad?: string | null;
    categoria_id?: string | null;
    divisibilidad_requerida?: boolean | null;
    actores_permitidos?: string;
    activo?: boolean;
    actorId?: string;
  }): Promise<any> {
    if (dto.actores_permitidos) {
      const validActores = ["todos", "comprador_verificado", "empresa", "premium"];
      if (!validActores.includes(dto.actores_permitidos)) {
        throw new BadRequestException(`Actores inválidos. Valores permitidos: ${validActores.join(", ")}`);
      }
    }

    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    if (dto.canal !== undefined) { sets.push(`canal = $${idx++}`); vals.push(dto.canal); }
    if (dto.modalidad !== undefined) { sets.push(`modalidad = $${idx++}`); vals.push(dto.modalidad || null); }
    if (dto.categoria_id !== undefined) { sets.push(`categoria_id = $${idx++}`); vals.push(dto.categoria_id || null); }
    if (dto.divisibilidad_requerida !== undefined) { sets.push(`divisibilidad_requerida = $${idx++}`); vals.push(dto.divisibilidad_requerida); }
    if (dto.actores_permitidos !== undefined) { sets.push(`actores_permitidos = $${idx++}`); vals.push(dto.actores_permitidos); }
    if (dto.activo !== undefined) { sets.push(`activo = $${idx++}`); vals.push(dto.activo); }
    if (sets.length === 0) return this.findOne(id);
    vals.push(id);

    const [row] = await this.dataSource.query(
      `UPDATE auction_matrix_rules SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      vals,
    );

    if (dto.actorId) {
      this.audit.log({
        userId: dto.actorId,
        action: "matrix_rule_updated",
        entity: "auction_matrix_rule",
        entityId: id,
        details: { changes: Object.keys(dto).filter(k => k !== "actorId") },
      });
    }

    return row;
  }

  async remove(id: string, actorId?: string): Promise<void> {
    await this.dataSource.query(`DELETE FROM auction_matrix_rules WHERE id = $1`, [id]);
    if (actorId) {
      this.audit.log({ userId: actorId, action: "matrix_rule_deleted", entity: "auction_matrix_rule", entityId: id });
    }
  }

  /** Valida que la combinación canal/modalidad/categoría/divisibilidad/actor esté permitida */
  async validarMatriz(input: MatrizValidationInput): Promise<void> {
    if (!input.canal) return;

    const params: any[] = [input.canal];
    let paramIdx = 2;

    let whereModalidad = "";
    if (input.modalidad) {
      whereModalidad = `AND (modalidad = $${paramIdx} OR modalidad IS NULL)`;
      params.push(input.modalidad);
      paramIdx++;
    } else {
      whereModalidad = `AND modalidad IS NULL`;
    }

    let whereCategoria = "";
    if (input.categoria_id) {
      whereCategoria = `AND (categoria_id = $${paramIdx}::uuid OR categoria_id IS NULL)`;
      params.push(input.categoria_id);
      paramIdx++;
    } else {
      whereCategoria = `AND categoria_id IS NULL`;
    }

    const [rule] = await this.dataSource.query(
      `SELECT * FROM auction_matrix_rules
       WHERE canal = $1 AND activo = TRUE
       ${whereModalidad}
       ${whereCategoria}
       ORDER BY categoria_id NULLS LAST
       LIMIT 1`,
      params,
    );

    if (!rule) {
      throw new BadRequestException(
        `No existe una regla de matriz para canal "${input.canal}"` +
        (input.modalidad ? `, modalidad "${input.modalidad}"` : "") +
        (input.categoria_id ? ` y la categoría seleccionada` : " sin categoría específica") +
        `. Configure la Matriz subasta en el panel de administración.`,
      );
    }

    if (rule.divisibilidad_requerida !== null) {
      if (input.divisible !== undefined && input.divisible !== rule.divisibilidad_requerida) {
        throw new BadRequestException(
          `Para canal "${input.canal}", la divisibilidad debe ser: ${rule.divisibilidad_requerida ? "Divisible" : "Indivisible"}.`,
        );
      }
    }

    if (rule.actores_permitidos && rule.actores_permitidos !== "todos" && input.actor_tipo) {
      if (input.actor_tipo !== rule.actores_permitidos && input.actor_tipo !== "admin") {
        throw new BadRequestException(
          `Para canal "${input.canal}", solo pueden participar actores tipo: ${rule.actores_permitidos}.`,
        );
      }
    }
  }

  /** Devuelve las reglas activas para un canal (para mostrar en frontend) */
  async reglasPorCanal(canal: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT r.*, c.name AS categoria_nombre
       FROM auction_matrix_rules r
       LEFT JOIN categories c ON c.id = r.categoria_id
       WHERE r.canal = $1 AND r.activo = TRUE
       ORDER BY r.modalidad NULLS LAST, r.categoria_id NULLS LAST`,
      [canal],
    );
  }
}
