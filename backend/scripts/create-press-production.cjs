const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const pool = new Pool({
  host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE,
});
pool.query("CREATE TABLE IF NOT EXISTS press (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(255) NOT NULL, excerpt TEXT, source VARCHAR(255) NOT NULL, link VARCHAR(500) NOT NULL, image_url VARCHAR(500), status VARCHAR(20) DEFAULT 'published', published_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()); CREATE INDEX IF NOT EXISTS idx_press_status ON press(status); CREATE INDEX IF NOT EXISTS idx_press_published_at ON press(published_at DESC)")
  .then(() => { console.log("OK"); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
