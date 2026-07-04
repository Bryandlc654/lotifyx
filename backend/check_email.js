const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const r = await client.query(`
    SELECT u.email, u.is_verified, uv.response_payload, uv.verification_status, uv.created_at
    FROM users u
    LEFT JOIN user_verifications uv ON uv.user_id = u.id
    WHERE u.email = 'bdelacruz654@gmail.com'
    ORDER BY uv.created_at DESC LIMIT 1
  `);
  if (r.rows.length === 0) {
    console.log('Usuario no encontrado');
  } else {
    console.log(JSON.stringify(r.rows[0], null, 2));
  }
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
