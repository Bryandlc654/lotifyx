const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  // Create auction for the iPhone product
  await client.query(`
    INSERT INTO auctions (product_id, vendedor_id, precio_inicial, precio_actual, incremento_minimo, fecha_inicio, fecha_fin, estado)
    SELECT id, user_id, $2, $2, $3, NOW(), $4, 'activo'
    FROM products WHERE id = $1 AND metodo_pago = 'subasta'
    ON CONFLICT (product_id) DO NOTHING
  `, ['b091cbbe-9aee-444e-97d8-c98e298e1322', 1500, 100, '2026-07-08T14:13:00.000Z']);
  
  const r = await client.query("SELECT * FROM auctions WHERE product_id='b091cbbe-9aee-444e-97d8-c98e298e1322'");
  console.log('Auction:', JSON.stringify(r.rows, null, 2));
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
