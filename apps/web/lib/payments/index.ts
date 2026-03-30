import { mercadoPagoAdapter } from "./adapters/mercado-pago";
import type { PaymentAdapter } from "./types";

const adapters: Record<string, PaymentAdapter> = {
  mercadopago: mercadoPagoAdapter,
};

export function getPaymentAdapter(): PaymentAdapter {
  const provider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase() || "mercadopago";
  return adapters[provider] ?? mercadoPagoAdapter;
}

export type {
  PaymentAdapter,
  CreatePreferenceInput,
  ProviderPayment,
  PaymentProviderStatus,
} from "./types";
