import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("faqs")
export class Faq {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 200 })
  category: string;

  @Column({ type: "text" })
  question: string;

  @Column({ type: "text" })
  answer: string;

  @Column({ default: 0 })
  order_index: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
