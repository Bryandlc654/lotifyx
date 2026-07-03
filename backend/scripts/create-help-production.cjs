const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const pool = new Pool({
  host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE,
});
pool.query("CREATE TABLE IF NOT EXISTS help_articles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(255) NOT NULL, category VARCHAR(100) NOT NULL, content TEXT NOT NULL, status VARCHAR(20) DEFAULT 'published', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()); CREATE INDEX IF NOT EXISTS idx_help_status ON help_articles(status); CREATE INDEX IF NOT EXISTS idx_help_category ON help_articles(category)")
  .then(() => { console.log("OK"); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
