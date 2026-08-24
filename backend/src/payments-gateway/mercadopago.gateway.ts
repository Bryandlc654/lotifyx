import { NotImplementedException } from "@nestjs/common";
import { PaymentGateway, GatewayChargeParams, GatewayChargeResult, GatewayVerificationResult } from "./payment-gateway.interface";

/**
 * Adaptador Mercado Pago. INTEGRACIÓN FUTURA: completar con MERCADOPAGO_ACCESS_TOKEN
 * (preference + checkout pro). Mientras no haya credenciales, isConfigured() = false y los
 * cobros fallan con error descriptivo sin afectar el flujo manual actual.
 */
export class MercadoPagoGateway implements PaymentGateway {
  readonly name = "mercadopago";

  isConfigured(): boolean {
    return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
  }

  private assertConfigured() {
    if (!this.isConfigured()) {
      throw new NotImplementedException("Pasarela Mercado Pago no configurada: define MERCADOPAGO_ACCESS_TOKEN");
    }
  }

  async createCharge(params: GatewayChargeParams): Promise<GatewayChargeResult> {
    this.assertConfigured();
    // TODO (integración futura): POST https://api.mercadopago.com/checkout/preferences
    throw new NotImplementedException("Integración con Mercado Pago pendiente de activación");
  }

  async verifyPayment(reference: string): Promise<GatewayVerificationResult> {
    this.assertConfigured();
    // TODO (integración futura): GET /v1/payments/search?external_reference=
    throw new NotImplementedException("Integración con Mercado Pago pendiente de activación");
  }
}
