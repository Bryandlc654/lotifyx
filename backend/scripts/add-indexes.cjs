const { Client } = require("pg");

async function run() {
  const client = new Client({
    host: "51.222.9.248",
    port: 5432,
    user: "lotifyx_user",
    password: "G(38a`7Wa7:+",
    database: "lotifyx_app",
  });

  await client.connect();
  console.log("Connected");

  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
    `CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`,
    `CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)`,
  ];

  for (const sql of indexes) {
    try {
      await client.query(sql);
      console.log("OK:", sql.substring(0, 60));
    } catch (e) {
      console.error("FAIL:", e.message);
    }
  }

  await client.end();
  console.log("Done");
}

run();
