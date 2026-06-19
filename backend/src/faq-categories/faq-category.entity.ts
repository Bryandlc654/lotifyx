import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("faq_categories")
export class FaqCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 200, unique: true })
  name: string;

  @Column({ length: 200, unique: true, nullable: true })
  slug: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ default: 0 })
  order_index: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
