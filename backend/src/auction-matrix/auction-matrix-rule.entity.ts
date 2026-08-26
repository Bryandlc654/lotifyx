import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("auction_matrix_rules")
export class AuctionMatrixRule {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 30 })
  canal: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  modalidad: string | null;

  @Column({ type: "uuid", nullable: true })
  categoria_id: string | null;

  @Column({ type: "boolean", nullable: true })
  divisibilidad_requerida: boolean | null;

  @Column({ type: "text", default: "todos" })
  actores_permitidos: string;

  @Column({ type: "boolean", default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
