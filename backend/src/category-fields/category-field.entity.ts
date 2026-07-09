import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("category_fields")
export class CategoryField {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
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
