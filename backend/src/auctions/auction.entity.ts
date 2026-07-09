import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("auctions")
export class Auction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  product_id: string;

  @Index()
  @Column({ type: "uuid" })
  vendedor_id: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  precio_inicial: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  precio_actual: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 1 })
  incremento_minimo: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  precio_reserva: number;

  @Column({ type: "timestamp" })
  fecha_inicio: Date;

  @Column({ type: "timestamp" })
  fecha_fin: Date;

  @Column({ length: 20, default: "pendiente" })
  estado: string;

  @Index()
  @Column({ type: "uuid", nullable: true })
  ganador_id: string | null;

  @Index()
  @Column({ type: "uuid", nullable: true })
  remaining_order_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
