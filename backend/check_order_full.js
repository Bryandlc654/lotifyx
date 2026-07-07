const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const r = await client.query("SELECT id, total_amount, status FROM orders WHERE id='f95b7419-4beb-44d6-9701-a3d81f540655'");
  console.log('Order:', JSON.stringify(r.rows, null, 2));
  const r2 = await client.query("SELECT * FROM order_items WHERE order_id='f95b7419-4beb-44d6-9701-a3d81f540655'");
  console.log('Items:', JSON.stringify(r2.rows, null, 2));
  const r3 = await client.query("SELECT * FROM auction_bids WHERE checkout_id='f95b7419-4beb-44d6-9701-a3d81f540655'");
  console.log('Bid:', JSON.stringify(r3.rows, null, 2));
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
