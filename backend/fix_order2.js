const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const orderId = 'ccca3702-1513-4574-bcdd-2ea7745482ad';
  
  // Find the auction bid for this order
  const [bid] = await client.query(
    `SELECT ab.*, a.product_id, p.title FROM auction_bids ab 
     INNER JOIN auctions a ON a.id = ab.auction_id
     LEFT JOIN products p ON p.id = a.product_id
     WHERE ab.checkout_id = $1 LIMIT 1`, [orderId]
  );
  
  if (bid.rows.length > 0) {
    const b = bid.rows[0];
    console.log('Found bid:', b.id, 'product:', b.product_id, 'title:', b.title);
    // Check if order_item already exists
    const existing = await client.query("SELECT id FROM order_items WHERE order_id=$1 AND product_id=$2", [orderId, b.product_id]);
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, price, created_at) VALUES ($1, $2, $3, NOW())`,
        [orderId, b.product_id, 150]
      );
      console.log('Order item added');
    } else {
      console.log('Order item already exists');
    }
  } else {
    console.log('No bid found for this order');
  }
  
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
