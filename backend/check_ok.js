const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const r = await client.query(`
    SELECT o.id, o.operation_number, o.total_amount, o.status, o.created_at,
      (SELECT json_agg(json_build_object('title', p.title, 'price', oi.price))
       FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=o.id) as items,
      (SELECT json_build_object('amount', ab.monto, 'status', ab.estado)
       FROM auction_bids ab WHERE ab.checkout_id=o.id LIMIT 1) as bid
    FROM orders o
    WHERE (SELECT COUNT(*) FROM auction_bids ab WHERE ab.checkout_id=o.id) > 0
    ORDER BY o.created_at DESC
    LIMIT 3
  `);
  for (const row of r.rows) {
    console.log(`Orden ${row.id.slice(0,8)}: ${row.items?.[0]?.title || 'SIN PRODUCTO'} | Puja S/ ${row.bid?.amount || 'N/A'} | ${row.status}`);
  }
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
