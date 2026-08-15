import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from "typeorm";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: true })
  parent_id: string | null;

  @ManyToOne(() => Category, (cat) => cat.children, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "parent_id" })
  parent: Category;

  @OneToMany(() => Category, (cat) => cat.parent)
  children: Category[];

  @Column({ length: 200 })
  name: string;

  @Column({ length: 200, unique: true })
  slug: string;

  @Column({ type: "text", nullable: true })
  icon: string;

  @Column({ length: 50, default: "active" })
  status: string;

  /** III.4: exige verificación de stock y ficha técnica para subastas / compra grupal de esta categoría */
  @Column({ type: "boolean", default: false })
  require_verification: boolean;

  @CreateDateColumn()
  created_at: Date;
}
