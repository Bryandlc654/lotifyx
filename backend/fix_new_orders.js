const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  // Fix all orders with bids but no items
  const r = await client.query(`
    SELECT o.id, o.total_amount, a.product_id
    FROM orders o
    INNER JOIN auction_bids ab ON ab.checkout_id = o.id
    INNER JOIN auctions a ON a.id = ab.auction_id
    WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id)
  `);
  console.log(`Found ${r.rows.length} orders without items`);
  for (const row of r.rows) {
    await client.query(
      `INSERT INTO order_items (order_id, product_id, price, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING`,
      [row.id, row.product_id, row.total_amount]
    );
    console.log(`Fixed: ${row.id.slice(0,8)}`);
  }
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
