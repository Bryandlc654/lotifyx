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

  /** Canal de la oportunidad transaccional (p.ej. 'subasta', 'demanda_agregada', 'subasta_inversa', 'oferta') */
  @Column({ type: "varchar", length: 30, default: "subasta" })
  canal: string;

  /** Precio objetivo de la oportunidad (según canal/modalidad) */
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  precio_objetivo: number | null;

  /** Divisibilidad de la oportunidad transaccional */
  @Column({ type: "boolean", default: false })
  divisible: boolean;

  @Column({ type: "timestamp" })
  fecha_inicio: Date;

  @Column({ type: "timestamp" })
  fecha_fin: Date;

  @Column({ length: 20, default: "pendiente" })
  estado: string;

  /** Tipo de subasta: null | inglesa | sobre_cerrado */
  @Column({ type: "varchar", length: 20, nullable: true })
  tipo_subasta: string | null;

  @Index()
  @Column({ type: "uuid", nullable: true })
  ganador_id: string | null;

  @Index()
  @Column({ type: "uuid", nullable: true })
  remaining_order_id: string | null;

  @Column({ type: "int", default: 0 })
  intentos_relocacion: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
