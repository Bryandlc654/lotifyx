const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_estimated_at TIMESTAMP");
  console.log('Columna tracking_estimated_at agregada');
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
