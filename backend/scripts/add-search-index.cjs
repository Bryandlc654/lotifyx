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

  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    console.log("pg_trgm enabled");
  } catch (e) {
    console.error("Extension failed:", e.message);
  }

  try {
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING gin (title gin_trgm_ops)`);
    console.log("Index created");
  } catch (e) {
    console.error("Index failed:", e.message);
  }

  await client.end();
}

run();
