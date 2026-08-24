import { NotImplementedException } from "@nestjs/common";
import { PaymentGateway, GatewayChargeParams, GatewayChargeResult, GatewayVerificationResult } from "./payment-gateway.interface";

/**
 * Adaptador Izipay (Perú). INTEGRACIÓN FUTURA: completar con IZIPAY_MERCHANT_ID / IZIPAY_PUBLIC_KEY /
 * IZIPAY_PRIVATE_KEY. Mientras no haya credenciales, isConfigured() = false y los cobros fallan
 * con error descriptivo sin afectar el flujo manual actual.
 */
export class IzipayGateway implements PaymentGateway {
  readonly name = "izipay";

  isConfigured(): boolean {
    return Boolean(process.env.IZIPAY_MERCHANT_ID && process.env.IZIPAY_PUBLIC_KEY && process.env.IZIPAY_PRIVATE_KEY);
  }

  private assertConfigured() {
    if (!this.isConfigured()) {
      throw new NotImplementedException("Pasarela Izipay no configurada: define IZIPAY_MERCHANT_ID, IZIPAY_PUBLIC_KEY e IZIPAY_PRIVATE_KEY");
    }
  }

  async createCharge(params: GatewayChargeParams): Promise<GatewayChargeResult> {
    this.assertConfigured();
    // TODO (integración futura): generar token de sesión y formulario de pago Izipay
    throw new NotImplementedException("Integración con Izipay pendiente de activación");
  }

  async verifyPayment(reference: string): Promise<GatewayVerificationResult> {
    this.assertConfigured();
    // TODO (integración futura): consulta de transacción por referencia
    throw new NotImplementedException("Integración con Izipay pendiente de activación");
  }
}
