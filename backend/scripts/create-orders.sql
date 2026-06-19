-- Migration: Create orders and order_items tables
-- Run this on production DB: psql -h 51.222.9.248 -U postgres -d lotifyx -f create-orders.sql

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_payment',
  origin_account_id UUID,
  operation_number VARCHAR(255),
  amount NUMERIC(12,2),
    proof_image VARCHAR(500),
    rejected_reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
