import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("leads")
export class Lead {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 200 })
  first_name: string;

  @Column({ length: 200 })
  last_name: string;

  @Column({ length: 300 })
  email: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ type: "text" })
  message: string;

  @CreateDateColumn()
  created_at: Date;
}
