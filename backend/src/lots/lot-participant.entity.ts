import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { LotSale } from "./lot-sale.entity";
import { User } from "../auth/entities/user.entity";

@Entity("lot_participants")
export class LotParticipant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @ManyToOne(() => LotSale)
  @JoinColumn({ name: "lot_sale_id" })
  @Column({ type: "uuid" })
  lot_sale_id: string;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: "comprador_id" })
  @Column({ type: "uuid" })
  comprador_id: string;

  @Column({ type: "int", default: 1 })
  cantidad: number;

  @Column({ default: false })
  garantia_pagada: boolean;

  @Column({ length: 20, default: "pendiente" })
  estado: string;

  @CreateDateColumn()
  created_at: Date;
}
