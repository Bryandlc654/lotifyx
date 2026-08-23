import { Module } from "@nestjs/common";
import { ConciliationService } from "./conciliation.service";
import { ConciliationController } from "./conciliation.controller";
import { AuditModule } from "../audit/audit.module";
import { CheckoutModule } from "../checkout/checkout.module";

@Module({
  imports: [AuditModule, CheckoutModule],
  providers: [ConciliationService],
  controllers: [ConciliationController],
  exports: [ConciliationService],
})
export class ConciliationModule {}
