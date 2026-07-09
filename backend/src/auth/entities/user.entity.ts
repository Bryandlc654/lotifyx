import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Role } from "./role.entity";
import { UserProfile } from "./user-profile.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: "role_id" })
  role: Role;

  @Index()
  @Column({ nullable: true })
  role_id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: "text" })
  password_hash: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  provider: string;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  referral_code: string;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: "referred_by" })
  @Column({ type: "uuid", nullable: true })
  referred_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;
}
