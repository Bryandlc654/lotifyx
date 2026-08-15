import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity("lot_benefit_applications")
export class LotBenefitApplication {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  lot_sale_id: string;

  @Column({ type: "uuid", nullable: true })
  tier_id: string;

  @Column({ type: "uuid", nullable: true })
  comprador_id: string;

  @Column({ type: "uuid", nullable: true })
  lot_participant_id: string;

  @Index()
  @Column({ type: "uuid", nullable: true })
  order_id: string;

  /** Texto legible del beneficio aplicado (traza) */
  @Column({ type: "text", nullable: true })
  beneficio_aplicado: string;

  /** Impacto en monto (ahorro S/ o flete cobrado) */
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  monto: number;

  @Column({ type: "int", default: 0 })
  unidades_extra: number;

  /** aplicado | liquidado */
  @Column({ length: 20, default: "aplicado" })
  estado: string;

  @Column({ type: "timestamp" })
  applied_at: Date;
}
