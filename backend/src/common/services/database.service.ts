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
      `ALTER TABLE lot_sales ADD COLUMN IF NOT EXISTS cmc INT DEFAULT 1`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS min_qty INT DEFAULT 1`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS cmc INT DEFAULT 1`,
      `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS qty INT DEFAULT 1`,
      `ALTER TABLE lot_participants ADD COLUMN IF NOT EXISTS order_id UUID`,
      `CREATE INDEX IF NOT EXISTS idx_lot_participants_order ON lot_participants (order_id)`,
      `ALTER TABLE lot_sales ADD COLUMN IF NOT EXISTS meta_venta INT`,
      `ALTER TABLE lot_sales ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0`,
      `CREATE TABLE IF NOT EXISTS lot_rcg_tiers (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         lot_sale_id UUID NOT NULL REFERENCES lot_sales(id) ON DELETE CASCADE,
         desde INT NOT NULL DEFAULT 1,
         hasta INT,
         tipo_beneficio VARCHAR(30) NOT NULL DEFAULT 'descuento',
         valor NUMERIC(10,2) NOT NULL DEFAULT 0,
         activacion VARCHAR(30) NOT NULL DEFAULT 'al_cierre',
         descripcion TEXT,
         created_at TIMESTAMPTZ DEFAULT NOW(),
         updated_at TIMESTAMPTZ DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_lot_rcg_tiers_lot ON lot_rcg_tiers (lot_sale_id)`,
      `CREATE TABLE IF NOT EXISTS lot_benefit_applications (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         lot_sale_id UUID NOT NULL REFERENCES lot_sales(id) ON DELETE CASCADE,
         tier_id UUID,
         comprador_id UUID,
         lot_participant_id UUID,
         order_id UUID,
         beneficio_aplicado TEXT,
         monto NUMERIC(10,2) DEFAULT 0,
         unidades_extra INT DEFAULT 0,
         estado VARCHAR(20) DEFAULT 'aplicado',
         applied_at TIMESTAMPTZ DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_lot_benefit_lot ON lot_benefit_applications (lot_sale_id)`,
      `CREATE INDEX IF NOT EXISTS idx_lot_benefit_order ON lot_benefit_applications (order_id)`,
      `CREATE TABLE IF NOT EXISTS product_views (
         id SERIAL PRIMARY KEY,
         user_id UUID REFERENCES users(id) ON DELETE CASCADE,
         product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
         created_at TIMESTAMPTZ DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_product_views_user ON product_views (user_id)`,
      `CREATE TABLE IF NOT EXISTS buyer_requests (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         user_id UUID NOT NULL,
         category_id UUID NOT NULL,
         title VARCHAR(255) NOT NULL,
         description TEXT,
         specifications JSONB DEFAULT '{}',
         image TEXT,
         precio_minimo NUMERIC(10,2),
         precio_maximo NUMERIC(10,2),
         cantidad INT DEFAULT 1,
         fecha_limite TIMESTAMPTZ,
         estado VARCHAR(20) DEFAULT 'abierta',
         created_at TIMESTAMPTZ DEFAULT NOW(),
         updated_at TIMESTAMPTZ DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_buyer_requests_user ON buyer_requests (user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_buyer_requests_estado ON buyer_requests (estado)`,
      `CREATE TABLE IF NOT EXISTS request_offers (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         request_id UUID NOT NULL REFERENCES buyer_requests(id) ON DELETE CASCADE,
         seller_id UUID NOT NULL,
         product_id UUID NOT NULL,
         precio NUMERIC(10,2) NOT NULL,
         cantidad INT DEFAULT 1,
         costo_envio NUMERIC(10,2) DEFAULT 0,
         mensaje TEXT,
         estado VARCHAR(20) DEFAULT 'pendiente',
         order_id UUID,
         created_at TIMESTAMPTZ DEFAULT NOW(),
         updated_at TIMESTAMPTZ DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_request_offers_request ON request_offers (request_id)`,
      `CREATE INDEX IF NOT EXISTS idx_request_offers_seller ON request_offers (seller_id)`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS nivel_coincidencia VARCHAR(20) DEFAULT 'estricta'`,
      `ALTER TABLE category_fields ADD COLUMN IF NOT EXISTS grupo VARCHAR(50) DEFAULT 'principal'`,
      `ALTER TABLE request_offers ADD COLUMN IF NOT EXISTS es_variante BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE request_offers ADD COLUMN IF NOT EXISTS coincidencia VARCHAR(20)`,
      `ALTER TABLE request_offers ADD COLUMN IF NOT EXISTS aceptacion_variante BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE categories ADD COLUMN IF NOT EXISTS require_verification BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS verification_required BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'none'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS ubicacion VARCHAR(150)`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'nuevo'`,
      `CREATE TABLE IF NOT EXISTS product_verifications (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
         payload JSONB DEFAULT '{}',
         estado VARCHAR(20) DEFAULT 'pendiente',
         revisado_por UUID,
         revisado_at TIMESTAMPTZ,
         observaciones TEXT,
         created_at TIMESTAMPTZ DEFAULT NOW(),
         updated_at TIMESTAMPTZ DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_product_verifications_product ON product_verifications (product_id)`,
      `CREATE TABLE IF NOT EXISTS app_config (
         key VARCHAR(100) PRIMARY KEY,
         value TEXT NOT NULL,
         updated_at TIMESTAMPTZ DEFAULT NOW()
       )`,
      `INSERT INTO app_config (key, value) VALUES ('garantia_subasta_inversa_pct', '5'), ('garantia_demanda_agregada_pct', '5') ON CONFLICT (key) DO NOTHING`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_stage VARCHAR(20)`,
      `ALTER TABLE lot_participants ADD COLUMN IF NOT EXISTS remaining_order_id UUID`,
      `ALTER TABLE lot_participants ADD COLUMN IF NOT EXISTS garantia_pct INT`,
      `ALTER TABLE request_offers ADD COLUMN IF NOT EXISTS remaining_order_id UUID`,
      `ALTER TABLE request_offers ADD COLUMN IF NOT EXISTS garantia_pct INT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`,
      `CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id)`,
      // Prohibición: una sola cuenta por persona (anti cuentas múltiples en subastas/votaciones)
      `UPDATE users SET phone = NULL WHERE id IN (
         SELECT id FROM (
           SELECT id, ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) AS rn
           FROM users WHERE phone IS NOT NULL AND phone <> ''
         ) t WHERE rn > 1
       )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone ON users (phone) WHERE phone IS NOT NULL AND phone <> ''`,
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_user_profiles_document_number ON user_profiles (document_number) WHERE document_number IS NOT NULL AND document_number <> ''`,
      // Detección de colusión: señales por evento y alertas generadas
      `CREATE TABLE IF NOT EXISTS event_signals (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         event_type VARCHAR(30) NOT NULL,
         event_id UUID NOT NULL,
         user_id UUID NOT NULL,
         ip VARCHAR(64),
         user_agent VARCHAR(512),
         amount NUMERIC(12,2),
         created_at TIMESTAMPTZ DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_event_signals_event ON event_signals (event_type, event_id)`,
      `CREATE INDEX IF NOT EXISTS idx_event_signals_user ON event_signals (user_id)`,
      `CREATE TABLE IF NOT EXISTS collusion_flags (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         event_type VARCHAR(30) NOT NULL,
         event_id UUID,
         rule VARCHAR(40) NOT NULL,
         severity VARCHAR(10) NOT NULL DEFAULT 'media',
         user_ids UUID[] NOT NULL DEFAULT '{}',
         detail JSONB DEFAULT '{}',
         status VARCHAR(20) NOT NULL DEFAULT 'abierto',
         created_at TIMESTAMPTZ DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_collusion_flags_status ON collusion_flags (status, created_at)`,
      `CREATE TABLE IF NOT EXISTS product_variants (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
         name VARCHAR(255) NOT NULL,
         attributes JSONB DEFAULT '{}',
         price NUMERIC(10,2),
         stock INT DEFAULT 0,
         created_at TIMESTAMPTZ DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants (product_id)`,
      `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID`,
      `CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items (variant_id)`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS es_servicio BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS tipo_inmobiliario VARCHAR(20)`,
      `ALTER TABLE lot_sales ADD COLUMN IF NOT EXISTS divisible BOOLEAN DEFAULT TRUE`,
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
         token TEXT NOT NULL,
         used BOOLEAN DEFAULT FALSE,
         expires_at TIMESTAMPTZ NOT NULL,
         created_at TIMESTAMPTZ DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens (token)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ubigeo VARCHAR(20)`,
      `INSERT INTO app_config (key, value) VALUES ('session_timeout_minutos', '120'), ('max_login_intentos', '5'), ('bloqueo_login_minutos', '15') ON CONFLICT (key) DO NOTHING`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS collusion_flagged BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS collusion_note TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS incumplimientos_count INT DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS sancionado BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS sancion_hasta TIMESTAMPTZ`,
      `INSERT INTO app_config (key, value) VALUES ('max_incumplimientos', '2'), ('sancion_dias', '7') ON CONFLICT (key) DO NOTHING`,
      // Garantía de oferta en RFQ + límites anti-flood + reconexión de ganador
      `ALTER TABLE request_offers ADD COLUMN IF NOT EXISTS garantia_oferta NUMERIC(12,2) DEFAULT 0`,
      `ALTER TABLE request_offers ADD COLUMN IF NOT EXISTS garantia_oferta_reservada BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS intentos_relocacion INT DEFAULT 0`,
      `INSERT INTO app_config (key, value) VALUES ('garantia_oferta_pct', '1'), ('max_ofertas_pendientes', '10'), ('max_pujas_pendientes', '5'), ('reconexion_dias', '3') ON CONFLICT (key) DO NOTHING`,
    ];
    for (const sql of migrations) {
      try { await this.dataSource.query(sql); } catch {}
    }
  }
}
