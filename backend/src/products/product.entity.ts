import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "uuid" })
  category_id: string;

  @Column({ length: 50, unique: true, nullable: true })
  sku: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "json", default: "{}" })
  specifications: Record<string, any>;

  @Column({ length: 50, default: "plataforma" })
  metodo_pago: string;

  @Column({ default: false })
  envio_delivery: boolean;

  @Column({ default: false })
  envio_courier: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  costo_envio: number;

  @Column({ length: 100, nullable: true })
  tiempo_entrega: string;

  @Column({ type: "text", nullable: true })
  cambios: string;

  @Column({ type: "text", nullable: true })
  devoluciones: string;

  @Column({ type: "text", nullable: true })
  garantia: string;

  @Column({ type: "text", nullable: true })
  politicas_imagenes: string;

  @Column({ length: 20, default: "draft" })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
