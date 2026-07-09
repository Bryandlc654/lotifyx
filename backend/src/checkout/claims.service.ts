import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class ClaimsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

  async createClaim(data: { userId: string; orderId: string; reason: string; description: string; solution: string; amount: number | null }) {
    await this.dataSource.query(
      `INSERT INTO claims (order_id, user_id, reason, description, solution, amount) VALUES ($1,$2,$3,$4,$5,$6)`,
      [data.orderId, data.userId, data.reason, data.description, data.solution, data.amount],
    );
    this.audit.log({ userId: data.userId, action: "claim_created", entity: "claim", entityId: data.orderId, details: { reason: data.reason } });
    return { message: "Reclamo enviado correctamente" };
  }

  async findAllClaims() {
    return this.dataSource.query(
      `SELECT c.*, o.total_amount, o.created_at as order_date,
              u.email as user_email, up.first_name as user_first_name, up.last_name as user_last_name
       FROM claims c
       LEFT JOIN orders o ON o.id = c.order_id
       LEFT JOIN users u ON u.id = c.user_id
       LEFT JOIN user_profiles up ON up.user_id = u.id
       ORDER BY c.created_at DESC LIMIT 200`,
    );
  }

  async updateClaimStatus(id: string, status: string) {
    await this.dataSource.query(
      `UPDATE claims SET status = $2, updated_at = NOW() WHERE id = $1`,
      [id, status],
    );
    this.audit.log({ action: "claim_updated", entity: "claim", entityId: id, details: { status } });
    return { message: "Reclamo actualizado" };
  }
}
