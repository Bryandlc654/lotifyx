import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("service_providers")
export class ServiceProvider {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", unique: true })
  user_id: string;

  /** Zonas de atención geográficas (ej. ["Lima", "Miraflores"]) */
  @Column({ type: "jsonb", default: "[]" })
  zonas_atencion: string[];

  /** Disponibilidad horaria (ej. { lunes: ["09:00-13:00","15:00-18:00"], sabado: [] }) */
  @Column({ type: "jsonb", default: "{}" })
  disponibilidad: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
