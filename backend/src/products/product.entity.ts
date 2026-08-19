import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  user_id: string;

  @Index()
  @Column({ type: "uuid" })
  category_id: string;

  @Column({ length: 50, unique: true, nullable: true })
  sku: string;

  @Column({ length: 255 })
  title: string;

  /** Nivel de coincidencia permitido por el vendedor: estricta | flexible | amplia */
  @Column({ length: 20, default: "estricta" })
  nivel_coincidencia: string;

  /** III.4 Verificación de stock y ficha técnica */
  @Column({ type: "boolean", default: false })
  verification_required: boolean;

  /** none | pendiente | approved | rejected */
  @Column({ length: 20, default: "none" })
  verification_status: string;

  /** Ubicación del bien (ciudad/país) */
  @Column({ length: 150, nullable: true })
  ubicacion: string;

  /** Condición del bien: nuevo | usado | reacondicionado */
  @Column({ length: 20, default: "nuevo" })
  estado: string;

  @Column({ type: "json", default: "{}" })
  specifications: Record<string, any>;

  /** true si es un servicio (sin stock físico / sin envío) */
  @Column({ type: "boolean", default: false })
  es_servicio: boolean;

  /** Inmobiliario: null (no inmobiliario) | alquiler | venta */
  @Column({ type: "varchar", length: 20, nullable: true })
  tipo_inmobiliario: string | null;

  /** Galería estándar de imágenes de la publicación (URLs) */
  @Column({ type: "jsonb", default: "[]" })
  images: string[];

  @Column({ length: 50, default: "plataforma" })
  metodo_pago: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  precio_base: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  precio_inicial: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  incremento_minimo: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  precio_lote: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  precio_individual: number;

  @Column({ type: "int", nullable: true })
  participantes_minimos: number;

  @Column({ type: "int", nullable: true })
  cantidad_total: number;

  /** CMC: cantidad mínima de compra por pedido en venta directa divisible */
  @Column({ type: "int", nullable: true })
  min_qty: number;

  /** CMC por participante para ventas por lote (demanda agregada) */
  @Column({ type: "int", nullable: true })
  cmc: number;

  @Column({ type: "timestamp", nullable: true })
  cierre_estimado: Date;

  @Column({ default: false })
  envio_delivery: boolean;

  @Column({ default: false })
  envio_courier: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  costo_envio: number;

  @Column({ length: 100, nullable: true })
  tiempo_entrega: string;

  @Column({ type: "text", nullable: true })
  cambios: string;

  @Column({ type: "text", nullable: true })
  devoluciones: string;

  @Column({ type: "text", nullable: true })
  garantia: string;

  @Column({ type: "text", nullable: true })
  politicas_imagenes: string;

  @Column({ length: 20, default: "draft" })
  status: string;

  @Column({ type: "int", default: 0 })
  stock: number;

  @Column({ type: "int", default: 0 })
  views: number;

  @Column({ type: "int", default: 0 })
  saves_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: "timestamp", nullable: true })
  deleted_at: Date;
}
