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
  console.log("Connected to DB");

  await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejected_reason VARCHAR(500)`);
  console.log("Column added successfully");

  await client.end();
}

run();
