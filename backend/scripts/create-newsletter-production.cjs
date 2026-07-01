const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

pool.query(
  "CREATE TABLE IF NOT EXISTS newsletter_subscribers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(200), email VARCHAR(255) UNIQUE NOT NULL, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW()); CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email)"
).then(() => { console.log("Tabla newsletter_subscribers creada en producción"); process.exit(0); }).catch(e => { console.error("Error:", e.message); process.exit(1); });
