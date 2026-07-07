const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  await client.query("ALTER TABLE auction_bids ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente'");
  await client.query("ALTER TABLE auction_bids ADD COLUMN IF NOT EXISTS checkout_id UUID");
  console.log('Columns added');
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
