import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("blog_posts")
export class BlogPost {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: "text" })
  content: string;

  @Column({ length: 500, nullable: true })
  excerpt: string;

  @Column({ length: 500, nullable: true })
  image_url: string;

  @Column({ length: 100, nullable: true })
  author: string;

  @Column({ length: 20, default: "draft" })
  status: string;

  @Column({ type: "timestamp", nullable: true })
  published_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
