const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const r = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='orders' ORDER BY ordinal_position");
  console.log(r.rows.map(c => c.column_name).join('\n'));
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
