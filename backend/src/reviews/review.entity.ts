import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  user_id: string;

  @Index()
  @Column({ type: "uuid" })
  product_id: string;

  @Index()
  @Column({ type: "uuid" })
  order_id: string;

  @Column({ type: "int" })
  rating: number;

  @Column({ type: "text", nullable: true })
  comment: string;

  @Column({ type: "text", array: true, nullable: true })
  images: string[];

  @CreateDateColumn()
  created_at: Date;
}
