import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("auction_bids")
export class AuctionBid {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  auction_id: string;

  @Index()
  @Column({ type: "uuid" })
  postor_id: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  monto: number;

  @Column({ length: 20, default: "pendiente" })
  estado: string;

  @Index()
  @Column({ type: "uuid", nullable: true })
  checkout_id: string;

  @CreateDateColumn()
  created_at: Date;
}
