import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("marquees")
export class Marquee {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 200 })
  name: string;

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
