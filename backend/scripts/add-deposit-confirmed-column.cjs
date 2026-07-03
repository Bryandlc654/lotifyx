const { Client } = require("pg");

require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Add deposit_confirmed column
  await client.query(`
    ALTER TABLE withdrawals
    ADD COLUMN IF NOT EXISTS deposit_confirmed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deposit_confirmed_at TIMESTAMP;
  `);

  console.log("Column deposit_confirmed added to withdrawals table");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
