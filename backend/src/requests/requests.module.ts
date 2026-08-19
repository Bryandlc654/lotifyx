import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BuyerRequest } from "./entities/buyer-request.entity";
import { RequestOffer } from "./entities/request-offer.entity";
import { RequestsService } from "./requests.service";
import { RequestsController } from "./requests.controller";
import { MatchingService } from "./matching.service";
import { ConfigModule } from "../config/config.module";
import { CollusionModule } from "../collusion/collusion.module";

@Module({
  imports: [TypeOrmModule.forFeature([BuyerRequest, RequestOffer]), ConfigModule, CollusionModule],
  controllers: [RequestsController],
  providers: [RequestsService, MatchingService],
  exports: [RequestsService],
})
export class RequestsModule {}
