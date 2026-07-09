import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("withdrawals")
export class Withdrawal {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 20, default: "pending" })
  status: string;

  @Column({ length: 100 })
  bank_name: string;

  @Column({ length: 50 })
  account_number: string;

  @Column({ length: 150 })
  account_holder: string;

  @Column({ default: false })
  deposit_confirmed: boolean;

  @Column({ type: "timestamp", nullable: true })
  deposit_confirmed_at: Date;

  @Column({ type: "timestamp", nullable: true })
  processed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
