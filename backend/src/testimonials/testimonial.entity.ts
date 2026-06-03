import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from "typeorm";

@Entity("testimonials")
export class Testimonial {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "int", default: 5 })
  stars: number;

  @Column({ type: "text" })
  text: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 150 })
  cargo: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: "int", default: 0 })
  order_index: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
