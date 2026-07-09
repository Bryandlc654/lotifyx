import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  conversation_id: string;

  @Index()
  @Column({ type: "uuid" })
  sender_id: string;

  @Column({ type: "text" })
  text: string;

  @Column({ type: "timestamp", nullable: true })
  read_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
