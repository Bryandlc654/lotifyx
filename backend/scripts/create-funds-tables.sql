-- Create withdrawals table for fund withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  bank_name VARCHAR(255),
  account_number VARCHAR(255),
  account_holder VARCHAR(255),
  notes TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);

-- Ensure funds table exists for all users (not just buyers)
INSERT INTO funds (user_id, available_balance, pending_balance, disputed_balance)
SELECT u.id, 0, 0, 0 FROM users u
LEFT JOIN funds f ON f.user_id = u.id
WHERE f.id IS NULL
ON CONFLICT (user_id) DO NOTHING;
