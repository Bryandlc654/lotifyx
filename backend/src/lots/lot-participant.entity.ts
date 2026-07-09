import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("lot_participants")
export class LotParticipant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  lot_sale_id: string;

  @Index()
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
