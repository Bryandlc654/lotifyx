import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity("funds")
export class Fund {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  user_id: string;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  available_balance: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  pending_balance: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  disputed_balance: number;
}
