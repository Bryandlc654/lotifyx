import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("product_verifications")
export class ProductVerification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  product_id: string;

  /** Evidencia por tipo: fotografias[], video, numero_serie, documentos[], capacidad_produccion{}, declaracion_ficha */
  @Column({ type: "json", default: {} })
  payload: Record<string, any>;

  /** pendiente | aprobada | rechazada */
  @Column({ length: 20, default: "pendiente" })
  estado: string;

  @Column({ type: "uuid", nullable: true })
  revisado_por: string | null;

  @Column({ type: "timestamp", nullable: true })
  revisado_at: Date | null;

  @Column({ type: "text", nullable: true })
  observaciones: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
