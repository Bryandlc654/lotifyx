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
  await client.query(`ALTER TABLE claims ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
  console.log("updated_at added");
  await client.end();
}

run();
