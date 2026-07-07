const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  // Check all orders with their items
  const orders = await client.query("SELECT id, total_amount, status, operation_number, created_at FROM orders ORDER BY created_at DESC LIMIT 5");
  console.log('=== ORDERS ===');
  for (const o of orders.rows) {
    console.log(`Order ${o.id.slice(0,8)}... op#${o.operation_number} total=${o.total_amount} status=${o.status}`);
    const items = await client.query("SELECT oi.*, p.title FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=$1", [o.id]);
    console.log(`  Items: ${items.rows.length}`);
    for (const item of items.rows) {
      console.log(`    - ${item.title || 'no title'} $${item.price}`);
    }
    const bids = await client.query("SELECT id, estado, checkout_id FROM auction_bids WHERE checkout_id=$1", [o.id]);
    if (bids.rows.length > 0) {
      console.log(`  Bid: ${bids.rows[0].id} estado=${bids.rows[0].estado}`);
    }
  }
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
