-- Add views and saves support to products
-- Run: psql -U postgres -d lotifyx -f scripts/add-views-saves.sql

ALTER TABLE products ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS saves_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS product_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_saves_user_id ON product_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_product_saves_product_id ON product_saves(product_id);
