const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  // Check user info@nextboostperu.com
  const r1 = await client.query("SELECT id, email, status FROM users WHERE email='info@nextboostperu.com'");
  console.log('=== USER ===');
  console.log(JSON.stringify(r1.rows, null, 2));
  
  if (r1.rows.length > 0) {
    const userId = r1.rows[0].id;
    const r2 = await client.query("SELECT user_id, plan_id, first_name, last_name FROM user_profiles WHERE user_id=$1", [userId]);
    console.log('\n=== PROFILE ===');
    console.log(JSON.stringify(r2.rows, null, 2));
    
    const r3 = await client.query("SELECT * FROM seller_plans WHERE user_id=$1 ORDER BY created_at DESC", [userId]);
    console.log('\n=== SELLER PLANS ===');
    console.log(JSON.stringify(r3.rows, null, 2));
    
    const r4 = await client.query("SELECT * FROM plans ORDER BY price ASC");
    console.log('\n=== PLANS ===');
    console.log(JSON.stringify(r4.rows, null, 2));
  }
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
