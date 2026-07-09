import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("conversations")
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  buyer_id: string;

  @Index()
  @Column({ type: "uuid" })
  seller_id: string;

  @Index()
  @Column({ nullable: true, type: "uuid" })
  product_id: string | null;

  @Column({ type: "text", nullable: true })
  last_message: string;

  @Column({ type: "timestamp", nullable: true })
  last_message_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
