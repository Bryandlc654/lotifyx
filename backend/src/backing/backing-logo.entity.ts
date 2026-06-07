import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("backing_logos")
export class BackingLogo {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column()
  image_url: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: "int", default: 0 })
  order_index: number;

  @CreateDateColumn()
  created_at: Date;
}
