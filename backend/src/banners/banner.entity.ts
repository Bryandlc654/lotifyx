import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("banners")
export class Banner {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column()
  image_url: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  order_index: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
