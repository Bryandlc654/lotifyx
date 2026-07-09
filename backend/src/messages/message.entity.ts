import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { Conversation } from "./conversation.entity";
import { User } from "../auth/entities/user.entity";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @ManyToOne(() => Conversation)
  @JoinColumn({ name: "conversation_id" })
  @Column({ type: "uuid" })
  conversation_id: string;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: "sender_id" })
  @Column({ type: "uuid" })
  sender_id: string;

  @Column({ type: "text" })
  text: string;

  @Column({ type: "timestamp", nullable: true })
  read_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
