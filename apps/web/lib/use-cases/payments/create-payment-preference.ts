import type { PaymentAdapter } from "@/lib/payments";

export interface CreatePaymentPreferenceInput {
  shipmentId: string;
  finalPrice: number;
  commission: number;
  appUrl: string;
}

export interface CreatePaymentPreferenceDeps {
  paymentAdapter: PaymentAdapter;
  persistPendingPayment: (input: {
    shipmentId: string;
    amount: number;
    commission: number;
    driverPayout: number;
    preferenceId: string;
  }) => Promise<void>;
}

export async function createPaymentPreferenceUseCase(
  deps: CreatePaymentPreferenceDeps,
  input: CreatePaymentPreferenceInput
): Promise<{ preferenceId: string; initPoint: string | null }> {
  const result = await deps.paymentAdapter.createPreference({
    shipmentId: input.shipmentId,
    finalPrice: input.finalPrice,
    appUrl: input.appUrl,
  });

  const driverPayout = input.finalPrice - input.commission;
  await deps.persistPendingPayment({
    shipmentId: input.shipmentId,
    amount: input.finalPrice,
    commission: input.commission,
    driverPayout,
    preferenceId: result.id,
  });

  return { preferenceId: result.id, initPoint: result.initPoint };
}
