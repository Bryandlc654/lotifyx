import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("lot_rcg_tiers")
export class LotRcgTier {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  lot_sale_id: string;

  /** Umbral inferior del rango (unidades comprometidas del lote) */
  @Column({ type: "int", default: 1 })
  desde: number;

  @Column({ type: "int", nullable: true })
  hasta: number;

  /** precio | descuento | flete | unidades_extra | destaque | otro | cashback */
  @Column({ length: 30, default: "descuento" })
  tipo_beneficio: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  valor: number;

  /** al_cmc | al_cierre | superar_expectativa */
  @Column({ length: 30, default: "al_cierre" })
  activacion: string;

  /** Regla legible que se muestra al comprador antes de adherirse */
  @Column({ type: "text", nullable: true })
  descripcion: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
