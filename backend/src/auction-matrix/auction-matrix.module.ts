import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuctionMatrixRule } from "./auction-matrix-rule.entity";
import { AuctionMatrixService } from "./auction-matrix.service";
import { AuctionMatrixPublicService } from "./auction-matrix-public.service";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [TypeOrmModule.forFeature([AuctionMatrixRule]), AuditModule],
  providers: [AuctionMatrixService, AuctionMatrixPublicService],
  exports: [AuctionMatrixService, AuctionMatrixPublicService],
})
export class AuctionMatrixModule {}
