const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const [users, profiles, verifications] = await Promise.all([
    client.query("SELECT id, email, is_verified, status, created_at FROM users ORDER BY created_at DESC"),
    client.query("SELECT id, user_id, first_name, last_name, account_type FROM user_profiles ORDER BY created_at DESC LIMIT 10"),
    client.query("SELECT * FROM user_verifications ORDER BY created_at DESC LIMIT 10"),
  ]);
  console.log('=== USERS ===');
  console.log(JSON.stringify(users.rows, null, 2));
  console.log('\n=== PROFILES ===');
  console.log(JSON.stringify(profiles.rows, null, 2));
  console.log('\n=== VERIFICATIONS ===');
  console.log(JSON.stringify(verifications.rows, null, 2));
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
