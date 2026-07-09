import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { Product } from "../products/product.entity";
import { User } from "../auth/entities/user.entity";
import { Order } from "../checkout/entities/order.entity";

@Entity("auctions")
export class Auction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @ManyToOne(() => Product)
  @JoinColumn({ name: "product_id" })
  @Column({ type: "uuid" })
  product_id: string;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: "vendedor_id" })
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
  @ManyToOne(() => User)
  @JoinColumn({ name: "ganador_id" })
  @Column({ type: "uuid", nullable: true })
  ganador_id: string | null;

  @Index()
  @ManyToOne(() => Order)
  @JoinColumn({ name: "remaining_order_id" })
  @Column({ type: "uuid", nullable: true })
  remaining_order_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
