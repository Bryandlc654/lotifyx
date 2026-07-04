const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const userId = 'a581f2b0-2720-46c9-944c-c0e582aa4e06';
  const planId = '67b4c543-f790-4159-bf4b-9a938501ccf4';
  
  // Actualizar plan_id en profile
  await client.query("UPDATE user_profiles SET plan_id=$1 WHERE user_id=$2", [planId, userId]);
  
  // Desactivar seller_plans anteriores
  await client.query("UPDATE seller_plans SET status='inactive' WHERE user_id=$1 AND status='active'", [userId]);
  
  // Crear seller_plan activo
  await client.query(
    `INSERT INTO seller_plans (user_id, plan_id, status, payment_status, starts_at, ends_at)
     VALUES ($1, $2, 'active', 'pending', NOW(), NOW() + INTERVAL '30 days')`,
    [userId, planId]
  );
  
  console.log('Plan activado correctamente');
  
  const r = await client.query("SELECT user_id, plan_id FROM user_profiles WHERE user_id=$1", [userId]);
  console.log('Profile plan_id:', r.rows[0]?.plan_id);
  
  const r2 = await client.query("SELECT * FROM seller_plans WHERE user_id=$1 AND status='active'", [userId]);
  console.log('Seller plan:', JSON.stringify(r2.rows, null, 2));
  
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
