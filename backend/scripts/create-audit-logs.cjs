const { Client } = require("pg");

async function run() {
  const client = new Client({
    host: "51.222.9.248",
    port: 5432,
    user: "lotifyx_user",
    password: "G(38a`7Wa7:+",
    database: "lotifyx_app",
  });

  await client.connect();
  console.log("Connected");

  await client.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      user_name VARCHAR(255),
      action VARCHAR(100) NOT NULL,
      entity VARCHAR(50) NOT NULL,
      entity_id VARCHAR(100),
      details JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("Table created");

  await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity)`);
  console.log("Indexes created");

  await client.end();
  console.log("Done");
}

run();
