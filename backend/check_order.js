const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const r = await client.query("SELECT id, status, tracking_status, user_id, total_amount FROM orders WHERE id='2585caee-14b0-49fe-aff1-462543237c5c'");
  console.log('ORDER:', JSON.stringify(r.rows, null, 2));
  if (r.rows.length > 0) {
    const order = r.rows[0];
    const seller = await client.query("SELECT p.user_id FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=$1 LIMIT 1", [order.id]);
    console.log('SELLER:', JSON.stringify(seller.rows, null, 2));
  }
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
