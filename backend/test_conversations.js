const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://loty_app_user:MHNJ9ED9bo0WDZ6fnPHIdvsWw7hH0J5W@dpg-d943558js32c73dgh800-a.oregon-postgres.render.com/loty_app',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  await client.connect();
  const userId = '535b7633-e96c-4946-94c4-c249888c0337';
  
  const r = await client.query(`
    SELECT c.id,
      buyer.email AS buyer_email,
      buyer_profile.first_name AS buyer_first_name,
      seller.email AS seller_email,
      seller_profile.first_name AS seller_first_name,
      p.title AS product_title
    FROM conversations c
    LEFT JOIN users buyer ON buyer.id = c.buyer_id
    LEFT JOIN user_profiles buyer_profile ON buyer_profile.user_id = c.buyer_id
    LEFT JOIN users seller ON seller.id = c.seller_id
    LEFT JOIN user_profiles seller_profile ON seller_profile.user_id = c.seller_id
    LEFT JOIN products p ON p.id = c.product_id
    WHERE c.buyer_id = $1 OR c.seller_id = $1
    ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
  `, [userId]);
  console.log('Query 1 OK, rows:', r.rows.length);
  console.log(JSON.stringify(r.rows, null, 2));
  
  if (r.rows.length > 0) {
    const convIds = r.rows.map(function(r) { return r.id; });
    const r2 = await client.query(`
      SELECT c.id AS conv_id, COUNT(*)::int AS cnt
      FROM messages m
      INNER JOIN conversations c ON c.id = m.conversation_id
      WHERE c.id = ANY($1) AND m.sender_id != $2 AND m.read_at IS NULL
      GROUP BY c.id
    `, [convIds, userId]);
    console.log('\nQuery 2 OK, rows:', r2.rows.length);
    console.log(JSON.stringify(r2.rows, null, 2));
  }
  
  await client.end();
}
main().catch(function(e) { console.error('ERROR:', e.message, e.position); process.exit(1); });
