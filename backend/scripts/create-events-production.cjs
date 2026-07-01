const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const pool = new Pool({
  host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE,
});
pool.query("CREATE TABLE IF NOT EXISTS events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(255) NOT NULL, description TEXT, event_date TIMESTAMP, location VARCHAR(255), image_url VARCHAR(500), status VARCHAR(20) DEFAULT 'published', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()); CREATE INDEX IF NOT EXISTS idx_events_status ON events(status); CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date DESC)")
  .then(() => { console.log("OK"); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
