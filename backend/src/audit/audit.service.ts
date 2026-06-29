import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class AuditService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async log(data: { userId?: string; userName?: string; action: string; entity: string; entityId?: string; details?: any }) {
    try {
      await this.ds.query(
        `INSERT INTO audit_logs (user_id, user_name, action, entity, entity_id, details) VALUES ($1,$2,$3,$4,$5,$6)`,
        [data.userId || null, data.userName || null, data.action, data.entity, data.entityId || null, JSON.stringify(data.details || {})],
      );
    } catch {
      // silently fail - audit log shouldn't break the main flow
    }
  }

  async findAll(filters?: { action?: string; entity?: string; limit?: number }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(filters.action);
    }
    if (filters?.entity) {
      conditions.push(`entity = $${paramIndex++}`);
      params.push(filters.entity);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filters?.limit || 200;

    return this.ds.query(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ${limit}`,
      params,
    );
  }
}
