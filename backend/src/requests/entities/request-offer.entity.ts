import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("request_offers")
export class RequestOffer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  request_id: string;

  @Index()
  @Column({ type: "uuid" })
  seller_id: string;

  @Index()
  @Column({ type: "uuid" })
  product_id: string;

  /** Precio unitario ofrecido (S/) */
  @Column({ type: "decimal", precision: 10, scale: 2 })
  precio: number;

  /** Cantidad de unidades ofertadas */
  @Column({ type: "int", default: 1 })
  cantidad: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  costo_envio: number;

  @Column({ type: "text", nullable: true })
  mensaje: string;

  /** pendiente | aceptada | rechazada */
  @Column({ type: "varchar", length: 20, default: "pendiente" })
  estado: string;

  /** Orden creada al aceptar la oferta */
  @Column({ type: "uuid", nullable: true })
  order_id: string;

  /** Orden de saldo (segundo hito) creada al aceptar la oferta */
  @Column({ type: "uuid", nullable: true })
  remaining_order_id: string;

  /** % de garantía de compromiso ofrecido por el vendedor (mínimo = umbral config) */
  @Column({ type: "int", nullable: true })
  garantia_pct: number | null;

  /** Garantía de oferta reservada de fondos del vendedor al ofertar (compromiso real) */
  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  garantia_oferta: number;

  @Column({ default: false })
  garantia_oferta_reservada: boolean;

  /** true si la oferta no coincide estrictamente con la solicitud */
  @Column({ default: false })
  es_variante: boolean;

  /** Nivel de coincidencia calculado: estricta | flexible | amplia */
  @Column({ type: "varchar", length: 20, nullable: true })
  coincidencia: string;

  /** Confirmación expresa del comprador al aceptar una variante */
  @Column({ default: false })
  aceptacion_variante: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
