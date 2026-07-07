const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();

  // Add auction/lot pricing fields to products table
  await client.query(`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS precio_base DECIMAL(10,2);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS precio_inicial DECIMAL(10,2);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS incremento_minimo DECIMAL(10,2);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS precio_lote DECIMAL(10,2);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS precio_individual DECIMAL(10,2);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS participantes_minimos INT DEFAULT 1;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS cierre_estimado TIMESTAMP;
  `);
  console.log('Products columns added');

  // Auctions table
  await client.query(`
    CREATE TABLE IF NOT EXISTS auctions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
      vendedor_id UUID NOT NULL REFERENCES users(id),
      precio_inicial DECIMAL(10,2) NOT NULL,
      precio_actual DECIMAL(10,2) NOT NULL,
      incremento_minimo DECIMAL(10,2) NOT NULL DEFAULT 1,
      precio_reserva DECIMAL(10,2),
      fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
      fecha_fin TIMESTAMP NOT NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
      ganador_id UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Auctions table created');

  // Auction bids table
  await client.query(`
    CREATE TABLE IF NOT EXISTS auction_bids (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
      postor_id UUID NOT NULL REFERENCES users(id),
      monto DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Auction bids table created');

  // Lot sales table
  await client.query(`
    CREATE TABLE IF NOT EXISTS lot_sales (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
      vendedor_id UUID NOT NULL REFERENCES users(id),
      precio_lote DECIMAL(10,2) NOT NULL,
      precio_individual DECIMAL(10,2) NOT NULL,
      participantes_minimos INT NOT NULL DEFAULT 1,
      fecha_cierre TIMESTAMP,
      estado VARCHAR(20) NOT NULL DEFAULT 'abierto',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Lot sales table created');

  // Lot participants table
  await client.query(`
    CREATE TABLE IF NOT EXISTS lot_participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lot_sale_id UUID NOT NULL REFERENCES lot_sales(id) ON DELETE CASCADE,
      comprador_id UUID NOT NULL REFERENCES users(id),
      cantidad INT NOT NULL DEFAULT 1,
      garantia_pagada BOOLEAN DEFAULT false,
      estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(lot_sale_id, comprador_id)
    );
  `);
  console.log('Lot participants table created');

  await client.end();
  console.log('All tables created successfully');
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
