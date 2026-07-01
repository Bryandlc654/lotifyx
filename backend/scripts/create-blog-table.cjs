const { DataSource } = require("typeorm");
require("dotenv").config();

const ds = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "lotifyx",
});

async function main() {
  await ds.initialize();
  await ds.query(`CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(500),
    image_url VARCHAR(500),
    author VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);
  await ds.query("CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)");
  await ds.query("CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)");
  await ds.query("CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC)");
  console.log("Tabla blog_posts creada correctamente");
  await ds.destroy();
}

main().catch(err => { console.error("Error:", err.message); process.exit(1); });
