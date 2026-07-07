const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  
  // Get latest order
  const orders = await client.query(`
    SELECT o.id, o.operation_number, o.total_amount, o.status, o.user_id, o.created_at,
      (SELECT json_agg(json_build_object('product_id', oi.product_id, 'title', p.title, 'price', oi.price))
       FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=o.id) as items,
      (SELECT json_build_object('id', ab.id, 'amount', ab.monto, 'status', ab.estado, 'checkout_id', ab.checkout_id)
       FROM auction_bids ab WHERE ab.checkout_id=o.id LIMIT 1) as bid,
      (SELECT json_build_object('id', a.id, 'product_id', a.product_id, 'status', a.estado, 'current_price', a.precio_actual)
       FROM auction_bids ab INNER JOIN auctions a ON a.id=ab.auction_id WHERE ab.checkout_id=o.id LIMIT 1) as auction
    FROM orders o
    WHERE (SELECT COUNT(*) FROM auction_bids ab WHERE ab.checkout_id=o.id) > 0
    ORDER BY o.created_at DESC
    LIMIT 5
  `);
  
  console.log('=== QA TEST: AUCTION BID -> ORDER -> PRODUCT LINK ===\n');
  
  for (const order of orders.rows) {
    console.log(`Order: ${order.id.slice(0,8)}...`);
    console.log(`  Operation: ${order.operation_number}`);
    console.log(`  Amount: S/ ${order.total_amount}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Items: ${order.items ? order.items.length : 0}`);
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        console.log(`    - ${item.title || 'NO TITLE'} (S/ ${item.price})`);
        if (!item.title) console.log('    ❌ PRODUCT MISSING!');
        else console.log('    ✅ Product linked');
      }
    } else {
      console.log('    ❌ No items!');
    }
    console.log(`  Bid: ${order.bid ? `S/ ${order.bid.amount} (${order.bid.status})` : 'NONE'}`);
    if (order.bid) {
      console.log(`    ✅ Bid linked to order via checkout_id`);
    } else {
      console.log('    ❌ No bid linked!');
    }
    console.log(`  Auction: ${order.auction ? `Product: ${order.auction.product_id.slice(0,8)}... Status: ${order.auction.status}` : 'NONE'}`);
    if (order.auction) {
      console.log('    ✅ Bid linked to auction');
    } else {
      console.log('    ❌ No auction linked!');
    }
    
    const allOk = order.items?.length > 0 && order.items[0]?.title && order.bid && order.auction;
    console.log(`  Result: ${allOk ? '✅ ALL OK' : '❌ ISSUES FOUND'}`);
    console.log('');
  }
  
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
