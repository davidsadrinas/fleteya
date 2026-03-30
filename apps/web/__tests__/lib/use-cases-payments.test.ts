import { describe, expect, it, vi } from "vitest";
import { createPaymentPreferenceUseCase } from "@/lib/use-cases/payments/create-payment-preference";
import { handlePaymentWebhookUseCase } from "@/lib/use-cases/payments/handle-payment-webhook";

describe("payment use-cases", () => {
  it("creates preference and persists pending payment", async () => {
    const createPreference = vi.fn().mockResolvedValue({
      id: "pref_1",
      initPoint: "https://checkout",
    });
    const persistPendingPayment = vi.fn().mockResolvedValue(undefined);

    const result = await createPaymentPreferenceUseCase(
      {
        paymentAdapter: {
          name: "fake",
          isConfigured: () => true,
          createPreference,
          getPaymentById: vi.fn(),
        },
        persistPendingPayment,
      },
      {
        shipmentId: "shipment-1",
        finalPrice: 15000,
        commission: 3000,
        appUrl: "https://fletaya.com.ar",
      }
    );

    expect(result.preferenceId).toBe("pref_1");
    expect(persistPendingPayment).toHaveBeenCalledWith({
      shipmentId: "shipment-1",
      amount: 15000,
      commission: 3000,
      driverPayout: 12000,
      preferenceId: "pref_1",
    });
  });

  it("handles approved webhook and executes side effects", async () => {
    const deps = {
      updatePendingPayment: vi.fn().mockResolvedValue(undefined),
      acceptShipmentIfPending: vi.fn().mockResolvedValue(undefined),
      emitInvoiceForPayment: vi.fn().mockResolvedValue({ cae: "123" }),
      findShipmentSummary: vi.fn().mockResolvedValue({
        clientId: "client-1",
        finalPrice: 20000,
      }),
      findClientProfile: vi.fn().mockResolvedValue({
        name: "Juan",
        email: "juan@test.com",
        phone: "+54911",
      }),
      notifyShipmentConfirmed: vi.fn().mockResolvedValue(undefined),
      trackPaymentCompleted: vi.fn().mockResolvedValue(undefined),
    };

    await handlePaymentWebhookUseCase(deps, {
      shipmentId: "shipment-1",
      payment: {
        id: "payment-1",
        status: "approved",
        paymentTypeId: "credit_card",
        amount: 20000,
        raw: {},
      },
    });

    expect(deps.updatePendingPayment).toHaveBeenCalledOnce();
    expect(deps.acceptShipmentIfPending).toHaveBeenCalledWith("shipment-1");
    expect(deps.notifyShipmentConfirmed).toHaveBeenCalledOnce();
    expect(deps.trackPaymentCompleted).toHaveBeenCalledOnce();
  });
});
