import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { Auction } from "./auction.entity";
import { User } from "../auth/entities/user.entity";

@Entity("auction_bids")
export class AuctionBid {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @ManyToOne(() => Auction)
  @JoinColumn({ name: "auction_id" })
  @Column({ type: "uuid" })
  auction_id: string;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: "postor_id" })
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
