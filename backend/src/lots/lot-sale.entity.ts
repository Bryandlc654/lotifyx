import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("lot_sales")
export class LotSale {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  product_id: string;

  @Index()
  @Column({ type: "uuid" })
  vendedor_id: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  precio_lote: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  precio_individual: number;

  @Column({ type: "int", default: 1 })
  participantes_minimos: number;

  /** CMC: cantidad mínima de unidades que cada comprador debe comprometer */
  @Column({ type: "int", default: 1 })
  cmc: number;

  @Column({ type: "int", default: 1 })
  cantidad_total: number;

  @Column({ type: "int", default: 0 })
  cantidad_reservada: number;

  /** Meta de venta publicada (expectativa a superar). Si es nulo se usa cantidad_total */
  @Column({ type: "int", nullable: true })
  meta_venta: number;

  /** Marca el lote como destacado cuando un beneficio de destaque queda activo */
  @Column({ type: "boolean", default: false })
  destacado: boolean;

  /** true = divisible (un participante puede tomar varias unidades); false = indivisible (1 unidad por participante) */
  @Column({ type: "boolean", default: true })
  divisible: boolean;

  @Column({ type: "timestamp", nullable: true })
  fecha_cierre: Date;

  @Column({ length: 20, default: "abierto" })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
