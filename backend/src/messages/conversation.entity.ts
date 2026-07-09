import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../auth/entities/user.entity";
import { Product } from "../products/product.entity";

@Entity("conversations")
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: "buyer_id" })
  @Column({ type: "uuid" })
  buyer_id: string;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: "seller_id" })
  @Column({ type: "uuid" })
  seller_id: string;

  @Index()
  @ManyToOne(() => Product)
  @JoinColumn({ name: "product_id" })
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
