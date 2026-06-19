import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";
@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
