import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  conversation_id: string;

  @Column({ type: "text" })
  sender_id: string;

  @Column({ type: "text" })
  text: string;

  @Column({ type: "timestamp", nullable: true })
  read_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
