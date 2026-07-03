const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const pool = new Pool({
  host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE,
});
pool.query("CREATE TABLE IF NOT EXISTS support_tickets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ticket_number VARCHAR(20) UNIQUE NOT NULL, name VARCHAR(200) NOT NULL, email VARCHAR(255) NOT NULL, subject VARCHAR(255) NOT NULL, description TEXT NOT NULL, images JSON DEFAULT '[]', files JSON DEFAULT '[]', status VARCHAR(20) DEFAULT 'open', response TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()); CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status); CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON support_tickets(ticket_number)")
  .then(() => { console.log("OK"); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
