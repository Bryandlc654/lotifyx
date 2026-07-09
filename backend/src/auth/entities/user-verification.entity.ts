import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("user_verifications")
export class UserVerification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Index()
  @Column()
  user_id: string;

  @Column({ length: 50 })
  verification_type: string;

  @Column({ length: 50, default: "pending" })
  verification_status: string;

  @Column({ nullable: true })
  provider: string;

  @Column({ type: "jsonb", nullable: true })
  request_payload: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  response_payload: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  verified_data: Record<string, any>;

  @Column({ nullable: true })
  verified_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
