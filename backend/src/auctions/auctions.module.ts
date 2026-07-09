import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Auction } from "./auction.entity";
import { AuctionBid } from "./auction-bid.entity";
import { AuctionsService } from "./auctions.service";
import { AuctionsController } from "./auctions.controller";
import { AuctionsSyncController } from "./sync.controller";
import { MessagesModule } from "../messages/messages.module";

@Module({
  imports: [TypeOrmModule.forFeature([Auction, AuctionBid]), MessagesModule],
  controllers: [AuctionsController, AuctionsSyncController],
  providers: [AuctionsService],
  exports: [AuctionsService],
})
export class AuctionsModule {}
