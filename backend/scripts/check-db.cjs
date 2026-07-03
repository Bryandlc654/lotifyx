const { Pool } = require("pg");
const pool = new Pool({
  host: "51.222.9.248",
  port: 5432,
  user: "lotifyx_user",
  password: "G(38a`7Wa7:+",
  database: "lotifyx_app",
  connectionTimeoutMillis: 5000,
});
pool.query("SELECT NOW()").then(r => {
  console.log("BD OK:", r.rows[0].now);
  pool.end();
}).catch(e => {
  console.error("BD ERROR:", e.message);
  pool.end();
});
