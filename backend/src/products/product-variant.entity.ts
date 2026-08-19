import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("product_variants")
export class ProductVariant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  product_id: string;

  /** Nombre legible de la variante, ej. "Talla M - Azul" */
  @Column({ length: 255 })
  name: string;

  /** Atributos de la variante, ej. { talla: "M", color: "Azul" } */
  @Column({ type: "jsonb", default: {} })
  attributes: Record<string, any>;

  /** Precio propio de la variante (si difiere del producto) */
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price: number;

  /** Stock independiente de la variante */
  @Column({ type: "int", default: 0 })
  stock: number;

  @CreateDateColumn()
  created_at: Date;
}
