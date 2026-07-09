import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, QueryRunner } from "typeorm";

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.ensureColumns();
  }

  async query(sql: string, params?: any[]) {
    return this.dataSource.query(sql, params);
  }

  async queryOne(sql: string, params?: any[]) {
    const rows = await this.dataSource.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  createQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }

  /** Ensures schema columns used by the application exist (migration-less bootstrap) */
  private async ensureColumns() {
    const migrations = [
      `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS remaining_order_id UUID`,
    ];
    for (const sql of migrations) {
      try { await this.dataSource.query(sql); } catch {}
    }
  }
}
