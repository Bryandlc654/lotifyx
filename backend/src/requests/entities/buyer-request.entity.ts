import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("buyer_requests")
export class BuyerRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  user_id: string;

  @Index()
  @Column({ type: "uuid" })
  category_id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "json", default: {} })
  specifications: Record<string, any>;

  /** Imagen principal opcional (subida a R2/uploads) */
  @Column({ type: "text", nullable: true })
  image: string | null;

  /** Rango de precio que el comprador puede pagar (S/) */
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  precio_minimo: number | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  precio_maximo: number | null;

  /** Cantidad de unidades que necesita */
  @Column({ type: "int", default: 1 })
  cantidad: number;

  /** Fecha límite para recibir ofertas */
  @Column({ type: "timestamp", nullable: true })
  fecha_limite: Date | null;

  /** abierta | aceptada | cancelada | expirada */
  @Column({ type: "varchar", length: 20, default: "abierta" })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
