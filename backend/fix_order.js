const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const orderId = 'f95b7419-4beb-44d6-9701-a3d81f540655';
  
  // Get the auction product for this order
  const [bid] = await client.query(
    `SELECT ab.*, a.product_id FROM auction_bids ab 
     INNER JOIN auctions a ON a.id = ab.auction_id 
     WHERE ab.checkout_id = $1 LIMIT 1`, [orderId]
  );
  
  if (bid.rows.length > 0) {
    const b = bid.rows[0];
    // Add order_item
    await client.query(
      `INSERT INTO order_items (order_id, product_id, price, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING`,
      [orderId, b.product_id, 150]
    );
    // Update total_amount
    await client.query(`UPDATE orders SET total_amount = 150 WHERE id = $1`, [orderId]);
    console.log('Fixed order:', orderId, 'with product:', b.product_id);
  } else {
    console.log('No bid found for this order');
  }
  
  // Verify
  const o = await client.query("SELECT id, total_amount, status FROM orders WHERE id=$1", [orderId]);
  console.log('Order:', JSON.stringify(o.rows, null, 2));
  const oi = await client.query("SELECT * FROM order_items WHERE order_id=$1", [orderId]);
  console.log('Items:', JSON.stringify(oi.rows, null, 2));
  
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
