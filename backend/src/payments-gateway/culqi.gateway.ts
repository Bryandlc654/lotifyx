import { NotImplementedException } from "@nestjs/common";
import { PaymentGateway, GatewayChargeParams, GatewayChargeResult, GatewayVerificationResult } from "./payment-gateway.interface";

/**
 * Adaptador Culqi (Perú). INTEGRACIÓN FUTURA: completar createCharge/verifyPayment con la API
 * privada usando CULQI_PRIVATE_KEY. Mientras no haya credenciales, isConfigured() = false y
 * cualquier intento de cobro lanza un error descriptivo sin afectar el flujo manual actual.
 */
export class CulqiGateway implements PaymentGateway {
  readonly name = "culqi";

  isConfigured(): boolean {
    return Boolean(process.env.CULQI_PRIVATE_KEY && process.env.CULQI_PUBLIC_KEY);
  }

  private assertConfigured() {
    if (!this.isConfigured()) {
      throw new NotImplementedException("Pasarela Culqi no configurada: define CULQI_PUBLIC_KEY y CULQI_PRIVATE_KEY");
    }
  }

  async createCharge(params: GatewayChargeParams): Promise<GatewayChargeResult> {
    this.assertConfigured();
    // TODO (integración futura): POST https://api.culqi.com/v2/charges
    throw new NotImplementedException("Integración con Culqi pendiente de activación");
  }

  async verifyPayment(reference: string): Promise<GatewayVerificationResult> {
    this.assertConfigured();
    // TODO (integración futura): GET https://api.culqi.com/v2/charges/{id}
    throw new NotImplementedException("Integración con Culqi pendiente de activación");
  }
}
