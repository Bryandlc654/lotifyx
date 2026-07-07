const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const r = await client.query(`
    SELECT o.id, o.operation_number, o.total_amount, o.status, o.created_at,
      (SELECT json_agg(json_build_object('product_id', oi.product_id, 'price', oi.price))
       FROM order_items oi WHERE oi.order_id = o.id) as items,
      (SELECT ab.estado FROM auction_bids ab WHERE ab.checkout_id = o.id LIMIT 1) as bid_status,
      (SELECT ab.id FROM auction_bids ab WHERE ab.checkout_id = o.id LIMIT 1) as bid_id
    FROM orders o
    ORDER BY o.created_at DESC
    LIMIT 3
  `);
  for (const row of r.rows) {
    console.log(`${row.id.slice(0,8)} op#${row.operation_number} items=${row.items ? row.items.length : 0} bid_status=${row.bid_status || 'none'} total=${row.total_amount}`);
    if (row.items) for (const item of row.items) console.log(`  product=${item.product_id?.slice(0,8)} price=${item.price}`);
  }
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
