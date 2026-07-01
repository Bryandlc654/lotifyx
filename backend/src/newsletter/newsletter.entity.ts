import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("newsletter_subscribers")
export class NewsletterSubscriber {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 200, nullable: true })
  name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}
