const { Client } = require("pg");
const fs = require("fs");

const client = new Client({
  host: "51.222.9.248",
  port: 5432,
  user: "lotifyx_user",
  password: "G(38a`7Wa7:+",
  database: "lotifyx_app",
});

async function main() {
  await client.connect();
  console.log("Conectado. Generando backup...");

  const lines = [];
  lines.push("-- Lotifyx DB Backup");
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push("");

  // Get all tables
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  for (const { table_name } of tables.rows) {
    // Disable triggers
    lines.push(`ALTER TABLE "${table_name}" DISABLE TRIGGER ALL;`);

    // Get columns
    const cols = await client.query(`
      SELECT column_name, data_type, character_maximum_length,
             is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table_name]);

    const colNames = cols.rows.map(c => `"${c.column_name}"`).join(", ");

    // Get all data
    const data = await client.query(`SELECT * FROM "${table_name}" ORDER BY 1`);

    if (data.rows.length > 0) {
      lines.push(`\n-- ${table_name}: ${data.rows.length} rows`);
      for (const row of data.rows) {
        const values = cols.rows.map(c => {
          const val = row[c.column_name];
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "number") return String(val);
          if (typeof val === "boolean") return val ? "true" : "false";
          if (Array.isArray(val)) return `ARRAY[${val.map(v => `'${escape(String(v))}'`).join(",")}]`;
          return `'${escape(String(val))}'`;
        });
        lines.push(`INSERT INTO "${table_name}" (${colNames}) VALUES (${values.join(", ")});`);
      }
    } else {
      lines.push(`\n-- ${table_name}: empty`);
    }

    // Re-enable triggers
    lines.push(`ALTER TABLE "${table_name}" ENABLE TRIGGER ALL;`);
    lines.push("");
  }

  // Generate CREATE TABLE statements
  const createLines = [];
  createLines.push("-- ====== SCHEMA ======\n");

  for (const { table_name } of tables.rows) {
    const create = await client.query(
      `SELECT pg_catalog.pg_get_ddl('table', '"${table_name}"'::regclass) AS ddl`
    );
    if (create.rows[0]) {
      createLines.push(create.rows[0].ddl + ";");
      createLines.push("");
    }
  }

  const output = createLines.join("\n") + "\n-- ====== DATA ======\n" + lines.join("\n");
  fs.writeFileSync("lotifyx_backup.sql", output, "utf8");
  console.log("Backup creado: lotifyx_backup.sql");
  await client.end();
}

function escape(s) {
  return s.replace(/'/g, "''").replace(/\\/g, "\\\\");
}

main().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
