import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("service_jobs")
export class ServiceJob {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "uuid", nullable: true })
  product_id: string | null;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  descripcion: string | null;

  /** Fotos del trabajo completado (portafolio) */
  @Column({ type: "jsonb", default: "[]" })
  fotos: string[];

  @Column({ length: 20, default: "completado" })
  estado: string;

  @CreateDateColumn()
  created_at: Date;
}
