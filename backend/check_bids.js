const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  // Check if estado column exists
  const r = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='auction_bids' ORDER BY ordinal_position");
  console.log('Columns:', r.rows.map(c => c.column_name).join(', '));
  
  // Verify auction_bids query works
  try {
    const r2 = await client.query("SELECT * FROM auction_bids WHERE estado='confirmada' LIMIT 1");
    console.log('Query OK:', r2.rows.length, 'rows');
  } catch (e) {
    console.error('Query error:', e.message);
  }
  
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
