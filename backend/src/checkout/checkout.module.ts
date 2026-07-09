import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";
import { OrdersService } from "./orders.service";
import { FundsService } from "./funds.service";
import { ClaimsService } from "./claims.service";
import { AuditModule } from "../audit/audit.module";
import { Order, OrderItem, Fund, Withdrawal } from "./entities";

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Fund, Withdrawal]), AuditModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, OrdersService, FundsService, ClaimsService],
  exports: [CheckoutService, OrdersService, FundsService, ClaimsService],
})
export class CheckoutModule {}
