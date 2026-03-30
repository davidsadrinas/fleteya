export type PaymentProviderStatus =
  | "approved"
  | "rejected"
  | "pending"
  | "refunded";

export interface CreatePreferenceInput {
  shipmentId: string;
  finalPrice: number;
  appUrl: string;
}

export interface PaymentPreferenceResult {
  id: string;
  initPoint: string | null;
}

export interface ProviderPayment {
  id: string;
  externalReference: string | null;
  status: PaymentProviderStatus;
  paymentTypeId: string | null;
  amount: number;
  raw: Record<string, unknown>;
}

export interface PaymentAdapter {
  readonly name: string;
  isConfigured(): boolean;
  createPreference(input: CreatePreferenceInput): Promise<PaymentPreferenceResult>;
  getPaymentById(paymentId: number): Promise<ProviderPayment>;
}
