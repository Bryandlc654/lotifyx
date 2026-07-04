const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  try {
    const r = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='conversations' ORDER BY ordinal_position");
    console.log('=== conversations columns ===');
    r.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));
  } catch (e) { console.error('Error:', e.message); }
  
  try {
    const r = await client.query("SELECT * FROM conversations LIMIT 5");
    console.log('\n=== sample conversations ===');
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (e) { console.error('Error:', e.message); }
  
  try {
    const r = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='messages' ORDER BY ordinal_position");
    console.log('\n=== messages columns ===');
    r.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));
  } catch (e) { console.error('Error:', e.message); }
  
  try {
    const r = await client.query("SELECT * FROM messages LIMIT 5");
    console.log('\n=== sample messages ===');
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (e) { console.error('Error:', e.message); }
  
  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
