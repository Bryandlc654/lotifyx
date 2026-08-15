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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
