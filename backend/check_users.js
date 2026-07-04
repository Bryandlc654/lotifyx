const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  return client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users'");
}).then(r => {
  console.log('=== users columns ===');
  console.log(r.rows.map(c => `${c.column_name} (${c.data_type})`).join('\n'));
  return client.query("SELECT id, email, is_verified, created_at FROM users ORDER BY created_at DESC LIMIT 5");
}).then(r => {
  console.log('\n=== Last 5 users ===');
  console.log(JSON.stringify(r.rows, null, 2));
  return client.end();
}).catch(e => { console.error('Error:', e.message); process.exit(1); });
