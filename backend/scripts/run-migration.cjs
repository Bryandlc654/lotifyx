const { Client } = require("pg");
const { readFileSync } = require("fs");
const { resolve } = require("path");

async function run() {
  const sql = readFileSync(resolve(__dirname, "create-orders.sql"), "utf8");

  const client = new Client({
    host: "51.222.9.248",
    port: 5432,
    user: "lotifyx_user",
    password: "G(38a`7Wa7:+",
    database: "lotifyx_app",
  });

  await client.connect();
  console.log("Connected to DB");

  try {
    await client.query(sql);
    console.log("Migration executed successfully");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
