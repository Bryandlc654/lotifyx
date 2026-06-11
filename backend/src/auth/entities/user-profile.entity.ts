import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("user_profiles")
export class UserProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column()
  user_id: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ type: "date", nullable: true })
  birth_date: string;

  @Column({ nullable: true })
  document_type: string;

  @Column({ nullable: true })
  document_number: string;

  @Column({ type: "text", nullable: true })
  avatar_url: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ nullable: true })
  profile_alias: string;

  @Column({ nullable: true })
  how_found_us: string;

  @Column({ unique: true, nullable: true })
  ruc: string;

  @Column({ nullable: true })
  razon_social: string;

  @Column({ nullable: true, length: 20 })
  account_type: string;

  @Column({ type: "uuid", nullable: true })
  plan_id: string;

  @CreateDateColumn()
  created_at: Date;
}
