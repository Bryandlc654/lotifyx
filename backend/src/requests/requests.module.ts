import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BuyerRequest } from "./entities/buyer-request.entity";
import { RequestOffer } from "./entities/request-offer.entity";
import { RequestsService } from "./requests.service";
import { RequestsController } from "./requests.controller";

@Module({
  imports: [TypeOrmModule.forFeature([BuyerRequest, RequestOffer])],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
