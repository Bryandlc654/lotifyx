import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { Product } from "../products/product.entity";
import { User } from "../auth/entities/user.entity";

@Entity("lot_sales")
export class LotSale {
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
  precio_lote: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  precio_individual: number;

  @Column({ type: "int", default: 1 })
  participantes_minimos: number;

  @Column({ type: "timestamp", nullable: true })
  fecha_cierre: Date;

  @Column({ length: 20, default: "abierto" })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
