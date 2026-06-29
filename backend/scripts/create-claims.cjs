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
    CREATE TABLE IF NOT EXISTS claims (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL,
      user_id UUID NOT NULL,
      reason VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      evidence_urls JSONB DEFAULT '[]',
      solution VARCHAR(100) NOT NULL,
      amount NUMERIC(12,2),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("Table created");
  await client.end();
}

run();
