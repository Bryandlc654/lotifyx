import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
} from "typeorm";
import { UserProfile } from "./user-profile.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;



  @Index()
  @Column({ nullable: true })
  role_id: string;

  role?: any; // relación inversa para OneToMany en Role

  @Column({ unique: true })
  email: string;

  @Column({ type: "text" })
  password_hash: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  provider: string;

  @Index()
  @Column({ type: "varchar", length: 255, nullable: true })
  google_id: string | null;

  @Column({ type: "boolean", default: false })
  collusion_flagged: boolean;

  @Column({ type: "text", nullable: true })
  collusion_note: string | null;

  @Column({ type: "int", default: 0 })
  incumplimientos_count: number;

  @Column({ type: "boolean", default: false })
  sancionado: boolean;

  @Column({ type: "timestamp", nullable: true })
  sancion_hasta: Date | null;

  @Column({ type: "int", default: 0 })
  login_attempts: number;

  @Column({ type: "timestamp", nullable: true })
  locked_until: Date | null;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  referral_code: string;

  @Index()
  @Column({ type: "uuid", nullable: true })
  referred_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;
}
