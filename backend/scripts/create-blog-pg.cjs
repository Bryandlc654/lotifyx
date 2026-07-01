const { Pool } = require("pg");
const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "lotifyx",
});
pool.query(
  "CREATE TABLE IF NOT EXISTS blog_posts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL, content TEXT NOT NULL, excerpt VARCHAR(500), image_url VARCHAR(500), author VARCHAR(100), status VARCHAR(20) DEFAULT 'draft', published_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()); CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status); CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug); CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC)"
).then(() => { console.log("OK"); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
