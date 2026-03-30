import { PAYMENT_RELEASE_HOURS } from "@shared/constants";

type PaymentInfo = {
  id: string;
  status: "approved" | "rejected" | "pending" | "refunded";
  paymentTypeId: string | null;
  amount: number;
  raw: Record<string, unknown>;
};

type ShipmentSummary = {
  clientId: string;
  finalPrice: number;
};

type ProfileSummary = {
  name: string | null;
  email: string | null;
  phone: string | null;
};

export interface HandlePaymentWebhookDeps {
  updatePendingPayment: (
    shipmentId: string,
    updateData: Record<string, unknown>
  ) => Promise<void>;
  acceptShipmentIfPending: (shipmentId: string) => Promise<void>;
  emitInvoiceForPayment: (input: {
    paymentId: string;
    shipmentId: string;
    amount: number;
  }) => Promise<{ cae?: string }>;
  findShipmentSummary: (shipmentId: string) => Promise<ShipmentSummary | null>;
  findClientProfile: (clientId: string) => Promise<ProfileSummary | null>;
  notifyShipmentConfirmed: (input: {
    clientId: string;
    shipmentId: string;
    finalPrice: number;
    profile: ProfileSummary;
    paymentAmount: number;
    cae?: string;
  }) => Promise<void>;
  trackPaymentCompleted: (input: {
    clientId: string;
    shipmentId: string;
    amount: number;
    paymentTypeId: string | null;
  }) => Promise<void>;
}

export async function handlePaymentWebhookUseCase(
  deps: HandlePaymentWebhookDeps,
  input: { shipmentId: string; payment: PaymentInfo }
): Promise<void> {
  const updateData: Record<string, unknown> = {
    mercadopago_id: input.payment.id,
    status: input.payment.status,
    mercadopago_payment_type: input.payment.paymentTypeId,
    webhook_verified: true,
    mercadopago_data: input.payment.raw,
    updated_at: new Date().toISOString(),
  };

  if (input.payment.status === "approved") {
    updateData.payout_status = "scheduled";
    updateData.payout_scheduled_at = new Date(
      Date.now() + PAYMENT_RELEASE_HOURS * 60 * 60 * 1000
    ).toISOString();
  }

  await deps.updatePendingPayment(input.shipmentId, updateData);

  if (input.payment.status !== "approved") return;

  await deps.acceptShipmentIfPending(input.shipmentId);
  const invoice = await deps.emitInvoiceForPayment({
    paymentId: input.payment.id,
    shipmentId: input.shipmentId,
    amount: input.payment.amount,
  });

  const shipment = await deps.findShipmentSummary(input.shipmentId);
  if (!shipment) return;
  const profile = await deps.findClientProfile(shipment.clientId);
  if (!profile) return;

  await deps.notifyShipmentConfirmed({
    clientId: shipment.clientId,
    shipmentId: input.shipmentId,
    finalPrice: shipment.finalPrice,
    profile,
    paymentAmount: input.payment.amount,
    cae: invoice.cae,
  });

  await deps.trackPaymentCompleted({
    clientId: shipment.clientId,
    shipmentId: input.shipmentId,
    amount: input.payment.amount,
    paymentTypeId: input.payment.paymentTypeId,
  });
}
