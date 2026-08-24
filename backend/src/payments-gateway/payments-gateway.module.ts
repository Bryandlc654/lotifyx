import { Module } from "@nestjs/common";
import { PaymentsGatewayService } from "./payments-gateway.service";
import { PaymentsGatewayController } from "./payments-gateway.controller";

@Module({
  providers: [PaymentsGatewayService],
  controllers: [PaymentsGatewayController],
  exports: [PaymentsGatewayService],
})
export class PaymentsGatewayModule {}
