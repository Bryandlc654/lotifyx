import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RefreshToken } from "../../auth/entities/refresh-token.entity";

@Injectable()
export class CleanupService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens() {
    const result = await this.refreshTokenRepo
      .createQueryBuilder()
      .delete()
      .where("expires_at < :now", { now: new Date() })
      .orWhere("is_revoked = :revoked", { revoked: true })
      .execute();

    if (result.affected && result.affected > 0) {
      console.log(`[Cron] ${result.affected} refresh tokens expirados eliminados`);
    }
  }
}
