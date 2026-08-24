import { Controller, Get, Post, Param, UseGuards, HttpCode, HttpStatus, Body } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";
import { PaymentsGatewayService } from "./payments-gateway.service";

@Controller()
export class PaymentsGatewayController {
  constructor(private readonly paymentsGatewayService: PaymentsGatewayService) {}

  /** Estado de la integración de pasarelas (panel admin) */
  @Get("admin/payments/gateway/status")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("orders.read")
  getStatus() {
    return this.paymentsGatewayService.getStatus();
  }

  /**
   * Webhook para notificaciones de la pasarela (INTEGRACIÓN FUTURA).
   * Endpoint público listo para recibir confirmaciones de pago cuando se active una pasarela.
   */
  @Post("webhooks/payments/:gateway")
  @HttpCode(HttpStatus.ACCEPTED)
  webhook(@Param("gateway") gateway: string, @Body() payload: any) {
    return {
      accepted: false,
      message: `Webhook de "${gateway}" recibido pero la pasarela aún no está activada (modo transferencia manual)`,
      received_at: new Date().toISOString(),
    };
  }
}
