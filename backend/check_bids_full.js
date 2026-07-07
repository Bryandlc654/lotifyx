const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const r = await client.query("SELECT ab.*, a.product_id FROM auction_bids ab LEFT JOIN auctions a ON a.id=ab.auction_id ORDER BY ab.created_at DESC");
  console.log('Bids:', JSON.stringify(r.rows, null, 2));
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
