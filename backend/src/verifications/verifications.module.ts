import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductVerification } from "./verification.entity";
import { VerificationsService } from "./verifications.service";
import { VerificationsController } from "./verifications.controller";

@Module({
  imports: [TypeOrmModule.forFeature([ProductVerification])],
  controllers: [VerificationsController],
  providers: [VerificationsService],
  exports: [VerificationsService],
})
export class VerificationsModule {}
