import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("auctions")
export class Auction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  product_id: string;

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

  @Column({ type: "uuid", nullable: true })
  ganador_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
