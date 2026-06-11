import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("plans")
export class Plan {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "int" })
  max_products: number;

  @Column({ type: "int", default: 0 })
  max_featured: number;

  @Column({ type: "int", default: 30 })
  duration_days: number;

  @Column({ type: "text", nullable: true })
  icon: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  order_index: number;

  @CreateDateColumn()
  created_at: Date;
}
