import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("conversations")
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "text" })
  buyer_id: string;

  @Index()
  @Column({ type: "text" })
  seller_id: string;

  @Index()
  @Column({ nullable: true, type: "text" })
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
