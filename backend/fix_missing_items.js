const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  // Find all orders with bids but no items
  const r = await client.query(`
    SELECT o.id, o.operation_number, o.total_amount,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
    FROM orders o
    WHERE (SELECT COUNT(*) FROM auction_bids ab WHERE ab.checkout_id = o.id) > 0
    AND (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) = 0
    ORDER BY o.created_at DESC
  `);
  if (r.rows.length === 0) {
    console.log('All orders already have items');
  } else {
    for (const row of r.rows) {
      console.log(`Fixing order ${row.id.slice(0,8)}... op#${row.operation_number}`);
      const [bid] = await client.query(
        `SELECT a.product_id FROM auction_bids ab INNER JOIN auctions a ON a.id=ab.auction_id WHERE ab.checkout_id=$1 LIMIT 1`,
        [row.id]
      );
      if (bid.rows.length > 0) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, price, created_at)
           VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING`,
          [row.id, bid.rows[0].product_id, row.total_amount]
        );
        console.log(`  -> Product ${bid.rows[0].product_id} added`);
      }
    }
  }
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
