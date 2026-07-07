const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const r = await client.query("SELECT oi.order_id, oi.product_id, oi.price, p.title FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id ORDER BY oi.created_at DESC LIMIT 10");
  console.log('order_items:', JSON.stringify(r.rows, null, 2));
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
