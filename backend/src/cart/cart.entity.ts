import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("carts")
export class Cart {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 36, unique: true })
  cart_id: string;

  @Index()
  @Column({ type: "uuid", nullable: true })
  user_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity("cart_items")
export class CartItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ length: 36 })
  cart_id: string;

  @Index()
  @Column({ type: "uuid" })
  product_id: string;

  @Column({ type: "int", default: 1 })
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  regular_price: number;

  @Column({ length: 500, nullable: true })
  image: string;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ length: 50, nullable: true })
  sku: string;

  @CreateDateColumn()
  created_at: Date;
}
