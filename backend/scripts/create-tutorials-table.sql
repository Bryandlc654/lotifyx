CREATE TABLE IF NOT EXISTS tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(500),
  image_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'published',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tutorials_status ON tutorials(status);
