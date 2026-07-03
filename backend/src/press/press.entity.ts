import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("press")
export class PressArticle {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  excerpt: string;

  @Column({ length: 255 })
  source: string;

  @Column({ length: 500 })
  link: string;

  @Column({ length: 500, nullable: true })
  image_url: string;

  @Column({ length: 20, default: "published" })
  status: string;

  @Column({ type: "timestamp", nullable: true })
  published_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
