import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { Category } from "../categories/category.entity";

@Entity("category_fields")
export class CategoryField {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @ManyToOne(() => Category)
  @JoinColumn({ name: "category_id" })
  @Column({ type: "uuid" })
  category_id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 200 })
  label: string;

  @Column({ length: 50, default: "text" })
  type: string;

  @Column({ default: false })
  required: boolean;

  @Column({ type: "json", nullable: true })
  options: string[];

  @Column({ default: 0 })
  order_index: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
