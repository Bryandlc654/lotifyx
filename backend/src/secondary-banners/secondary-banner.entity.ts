import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from "typeorm";

@Entity("secondary_banners")
export class SecondaryBanner {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 300, nullable: true })
  subtitle: string;

  @Column()
  image_url: string;

  @Column({ type: "text", nullable: true })
  link_url: string;

  @Column({ length: 100, nullable: true })
  button_text: string;

  @Column({ length: 20 })
  type: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: "int", default: 0 })
  order_index: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
