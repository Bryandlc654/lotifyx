const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const orderId = '71d66903-6d76-4752-997a-62e88d7b71d2';
  const o = await client.query("SELECT id, total_amount, status FROM orders WHERE id=$1", [orderId]);
  console.log('Order:', JSON.stringify(o.rows, null, 2));
  const items = await client.query("SELECT * FROM order_items WHERE order_id=$1", [orderId]);
  console.log('Items:', JSON.stringify(items.rows, null, 2));
  const bids = await client.query("SELECT ab.id, ab.auction_id, ab.estado, ab.checkout_id, a.product_id FROM auction_bids ab INNER JOIN auctions a ON a.id=ab.auction_id WHERE ab.checkout_id=$1", [orderId]);
  console.log('Bid:', JSON.stringify(bids.rows, null, 2));
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
