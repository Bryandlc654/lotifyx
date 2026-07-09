import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total_amount: number;

  @Column({ length: 30, default: "pending_payment" })
  status: string;

  @Index()
  @Column({ type: "uuid", nullable: true })
  origin_account_id: string;

  @Column({ length: 100, nullable: true })
  operation_number: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ type: "text", nullable: true })
  proof_image: string;

  @Column({ type: "text", nullable: true })
  rejected_reason: string;

  @Column({ length: 30, nullable: true })
  tracking_status: string;

  @Column({ type: "timestamp", nullable: true })
  tracking_estimated_at: Date;

  @Column({ type: "timestamp", nullable: true })
  tracking_coordination_at: Date;

  @Column({ type: "timestamp", nullable: true })
  tracking_shipping_at: Date;

  @Column({ type: "timestamp", nullable: true })
  tracking_delivered_at: Date;

  @Column({ type: "text", nullable: true })
  shipping_address: string;

  @Column({ type: "text", nullable: true })
  shipping_reference: string;

  @Column({ length: 100, nullable: true })
  shipping_city: string;

  @Column({ type: "text", nullable: true })
  shipping_notes: string;

  @Column({ length: 100, nullable: true })
  tracking_number: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
