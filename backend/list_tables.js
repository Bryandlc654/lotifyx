const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  return client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
}).then(r => {
  console.log(r.rows.map(t => t.table_name).join('\n'));
  return client.end();
}).catch(e => { console.error('Error:', e.message); process.exit(1); });
