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

  await client.query(`ALTER TABLE plan_payments ADD COLUMN IF NOT EXISTS operation_number VARCHAR(255)`);
  await client.query(`ALTER TABLE plan_payments ADD COLUMN IF NOT EXISTS origin_account_id UUID`);
  console.log("Columns added");

  await client.end();
}

run();
