const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  // Verificar el usuario
  await client.query("UPDATE users SET is_verified=true, status='active' WHERE email='info@nextboostperu.com'");
  // Actualizar verificación
  await client.query("UPDATE user_verifications SET verification_status='verified', verified_at=NOW() WHERE user_id=(SELECT id FROM users WHERE email='info@nextboostperu.com')");
  console.log('Usuario verificado correctamente');
  
  const r = await client.query("SELECT id, email, is_verified, status FROM users WHERE email='info@nextboostperu.com'");
  console.log(JSON.stringify(r.rows, null, 2));
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
