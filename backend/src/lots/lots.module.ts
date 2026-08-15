import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LotSale } from "./lot-sale.entity";
import { LotParticipant } from "./lot-participant.entity";
import { LotRcgTier } from "./lot-rcg-tier.entity";
import { LotBenefitApplication } from "./lot-benefit-application.entity";
import { ConfigModule } from "../config/config.module";
import { LotsService } from "./lots.service";
import { LotsController } from "./lots.controller";

@Module({
  imports: [TypeOrmModule.forFeature([LotSale, LotParticipant, LotRcgTier, LotBenefitApplication]), ConfigModule],
  controllers: [LotsController],
  providers: [LotsService],
  exports: [LotsService],
})
export class LotsModule {}
