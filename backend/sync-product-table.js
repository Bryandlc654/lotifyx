const { Pool } = require("pg");

const pool = new Pool({
  host: "51.222.9.248",
  port: 5432,
  user: "lotifyx_user",
  password: "G(38a`7Wa7:+",
  database: "lotifyx_app",
});

const sql = `
CREATE TABLE IF NOT EXISTS products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    title varchar(255) NOT NULL,
    specifications json DEFAULT '{}',
    metodo_pago varchar(50) DEFAULT 'plataforma',
    envio_delivery boolean DEFAULT false,
    envio_courier boolean DEFAULT false,
    costo_envio decimal(10,2) DEFAULT 0,
    tiempo_entrega varchar(100),
    cambios text,
    devoluciones text,
    garantia text,
    politicas_imagenes text,
    status varchar(20) DEFAULT 'draft',
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);
`;

pool.query(sql)
  .then(() => { console.log("Products table created successfully"); return pool.end(); })
  .then(() => process.exit(0))
  .catch(e => { console.error("Error:", e.message); pool.end(); process.exit(1); });
