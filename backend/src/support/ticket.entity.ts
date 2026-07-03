import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("support_tickets")
export class SupportTicket {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 20, unique: true })
  ticket_number: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 255 })
  subject: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "json", default: "[]" })
  images: string[];

  @Column({ type: "json", default: "[]" })
  files: string[];

  @Column({ length: 20, default: "open" })
  status: string;

  @Column({ type: "text", nullable: true })
  response: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
