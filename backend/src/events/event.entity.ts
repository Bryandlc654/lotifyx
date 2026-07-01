import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "timestamp", nullable: true })
  event_date: Date;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({ length: 500, nullable: true })
  image_url: string;

  @Column({ length: 20, default: "published" })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
