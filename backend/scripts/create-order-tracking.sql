-- Add tracking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_coordination_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_shipping_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_delivered_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_reference VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);

-- Create tracking history table
CREATE TABLE IF NOT EXISTS order_tracking_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  note TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_history_order ON order_tracking_history(order_id);
