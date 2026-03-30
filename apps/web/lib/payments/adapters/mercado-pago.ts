import { MercadoPagoConfig, Payment as MPPayment, Preference } from "mercadopago";
import type {
  CreatePreferenceInput,
  PaymentAdapter,
  PaymentPreferenceResult,
  PaymentProviderStatus,
  ProviderPayment,
} from "../types";

const STATUS_MAP: Record<string, PaymentProviderStatus> = {
  approved: "approved",
  rejected: "rejected",
  in_process: "pending",
  pending: "pending",
  refunded: "refunded",
  charged_back: "refunded",
  cancelled: "rejected",
};

function getAccessToken(): string | null {
  return process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ?? null;
}

function mapStatus(status: unknown): PaymentProviderStatus {
  if (typeof status !== "string") return "pending";
  return STATUS_MAP[status] ?? "pending";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export const mercadoPagoAdapter: PaymentAdapter = {
  name: "mercadopago",

  isConfigured(): boolean {
    return Boolean(getAccessToken());
  },

  async createPreference(input: CreatePreferenceInput): Promise<PaymentPreferenceResult> {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error("MercadoPago no configurado");
    }
    const mpConfig = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(mpConfig);
    const result = await preference.create({
      body: {
        items: [
          {
            id: input.shipmentId,
            title: `Flete #${input.shipmentId.slice(0, 8)}`,
            quantity: 1,
            unit_price: input.finalPrice,
            currency_id: "ARS",
          },
        ],
        back_urls: {
          success: `${input.appUrl}/shipment/confirmation?id=${input.shipmentId}`,
          failure: `${input.appUrl}/shipment?error=payment`,
          pending: `${input.appUrl}/shipment?pending=true`,
        },
        notification_url: `${input.appUrl}/api/payments/webhook`,
        external_reference: input.shipmentId,
        auto_return: "approved",
      },
    });
    return {
      id: String(result.id),
      initPoint: result.init_point ?? null,
    };
  },

  async getPaymentById(paymentId: number): Promise<ProviderPayment> {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error("MercadoPago no configurado");
    }
    const mpConfig = new MercadoPagoConfig({ accessToken });
    const mpPayment = new MPPayment(mpConfig);
    const rawResponse = await mpPayment.get({ id: paymentId });
    const raw = asRecord(rawResponse);
    return {
      id: String(raw.id ?? paymentId),
      externalReference:
        typeof raw.external_reference === "string" ? raw.external_reference : null,
      status: mapStatus(raw.status),
      paymentTypeId: typeof raw.payment_type_id === "string" ? raw.payment_type_id : null,
      amount: typeof raw.transaction_amount === "number" ? raw.transaction_amount : 0,
      raw,
    };
  },
};
