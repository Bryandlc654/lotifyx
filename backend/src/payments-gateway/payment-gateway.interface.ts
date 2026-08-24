/**
 * Contrato único que deberá cumplir cualquier pasarela de pagos (Culqi, Izipay, Mercado Pago).
 * Los flujos actuales de LOTIFYX (transferencia manual) no cambian; cuando se contrate una
 * pasarela solo hace falta completar el adaptador correspondiente sin tocar el resto del sistema.
 */
export interface GatewayChargeParams {
  order_id: string;
  amount: number;
  currency: string;
  description?: string;
  customer_email?: string;
}

export interface GatewayChargeResult {
  success: boolean;
  reference: string;
  checkout_url?: string | null;
  message?: string;
  raw?: any;
}

export interface GatewayVerificationResult {
  found: boolean;
  paid: boolean;
  amount?: number;
  raw?: any;
}

export interface PaymentGateway {
  readonly name: string;
  /** true si las credenciales de la pasarela están presentes en el entorno */
  isConfigured(): boolean;
  createCharge(params: GatewayChargeParams): Promise<GatewayChargeResult>;
  verifyPayment(reference: string): Promise<GatewayVerificationResult>;
}
