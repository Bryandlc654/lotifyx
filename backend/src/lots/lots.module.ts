import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LotSale } from "./lot-sale.entity";
import { LotParticipant } from "./lot-participant.entity";
import { LotsService } from "./lots.service";
import { LotsController } from "./lots.controller";

@Module({
  imports: [TypeOrmModule.forFeature([LotSale, LotParticipant])],
  controllers: [LotsController],
  providers: [LotsService],
  exports: [LotsService],
})
export class LotsModule {}
