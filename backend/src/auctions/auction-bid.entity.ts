import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("auction_bids")
export class AuctionBid {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  auction_id: string;

  @Column({ type: "uuid" })
  postor_id: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  monto: number;

  @CreateDateColumn()
  created_at: Date;
}
