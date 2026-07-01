import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("tutorials")
export class Tutorial {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  video_url: string;

  @Column({ length: 500, nullable: true })
  image_url: string;

  @Column({ length: 20, default: "published" })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
