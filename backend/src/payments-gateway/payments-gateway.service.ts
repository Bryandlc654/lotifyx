import { Injectable } from "@nestjs/common";
import { PaymentGateway, GatewayChargeParams, GatewayChargeResult, GatewayVerificationResult } from "./payment-gateway.interface";
import { CulqiGateway } from "./culqi.gateway";
import { IzipayGateway } from "./izipay.gateway";
import { MercadoPagoGateway } from "./mercadopago.gateway";

/**
 * Fábrica de pasarelas: la pasarela activa se elige con la variable de entorno PAYMENT_GATEWAY
 * (culqi | izipay | mercadopago | none). Por defecto "none": LOTIFYX opera con transferencia
 * manual y queda preparado para activar cualquier pasarela solo configurando credenciales.
 */
@Injectable()
export class PaymentsGatewayService {
  private readonly gateways: Record<string, PaymentGateway> = {
    culqi: new CulqiGateway(),
    izipay: new IzipayGateway(),
    mercadopago: new MercadoPagoGateway(),
  };

  getActiveGateway(): PaymentGateway | null {
    const key = (process.env.PAYMENT_GATEWAY || "").toLowerCase();
    return this.gateways[key] || null;
  }

  async getStatus() {
    const active = (process.env.PAYMENT_GATEWAY || "none").toLowerCase();
    const available = Object.values(this.gateways).map(g => ({
      name: g.name,
      configured: g.isConfigured(),
      active: g.name === active,
    }));
    return {
      mode: active === "none" ? "manual" : active,
      manual_transfer_active: active === "none",
      gateways: available,
    };
  }

  createCharge(params: GatewayChargeParams): Promise<GatewayChargeResult> {
    const gw = this.getActiveGateway();
    if (!gw) return Promise.reject(new Error("No hay pasarela de pagos activa (modo transferencia manual)"));
    return gw.createCharge(params);
  }

  verifyPayment(reference: string): Promise<GatewayVerificationResult> {
    const gw = this.getActiveGateway();
    if (!gw) return Promise.reject(new Error("No hay pasarela de pagos activa (modo transferencia manual)"));
    return gw.verifyPayment(reference);
  }
}
