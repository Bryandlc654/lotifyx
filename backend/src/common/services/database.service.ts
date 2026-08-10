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
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS cantidad_total INT`,
      `ALTER TABLE lot_sales ADD COLUMN IF NOT EXISTS cantidad_total INT DEFAULT 1`,
      `ALTER TABLE lot_sales ADD COLUMN IF NOT EXISTS cantidad_reservada INT DEFAULT 0`,
      `CREATE TABLE IF NOT EXISTS product_views (
         id SERIAL PRIMARY KEY,
         user_id UUID REFERENCES users(id) ON DELETE CASCADE,
         product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
         created_at TIMESTAMPTZ DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_product_views_user ON product_views (user_id)`,
    ];
    for (const sql of migrations) {
      try { await this.dataSource.query(sql); } catch {}
    }
  }
}
