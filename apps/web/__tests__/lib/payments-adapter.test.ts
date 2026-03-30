import { beforeEach, describe, expect, it, vi } from "vitest";

const preferenceCreateMock = vi.fn();
const paymentGetMock = vi.fn();

vi.mock("mercadopago", () => ({
  MercadoPagoConfig: vi.fn(),
  Preference: vi.fn().mockImplementation(() => ({
    create: preferenceCreateMock,
  })),
  Payment: vi.fn().mockImplementation(() => ({
    get: paymentGetMock,
  })),
}));

describe("payments adapter abstraction", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.MERCADOPAGO_ACCESS_TOKEN = "token";
    delete process.env.PAYMENT_PROVIDER;
  });

  it("returns MercadoPago adapter by default", async () => {
    const { getPaymentAdapter } = await import("@/lib/payments");
    const adapter = getPaymentAdapter();
    expect(adapter.name).toBe("mercadopago");
    expect(adapter.isConfigured()).toBe(true);
  });

  it("creates checkout preference through adapter interface", async () => {
    preferenceCreateMock.mockResolvedValue({
      id: "pref_1",
      init_point: "https://mp/checkout",
    });
    const { getPaymentAdapter } = await import("@/lib/payments");
    const adapter = getPaymentAdapter();
    const result = await adapter.createPreference({
      shipmentId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      finalPrice: 10000,
      appUrl: "https://fletaya.com.ar",
    });
    expect(result.id).toBe("pref_1");
    expect(result.initPoint).toContain("https://mp/");
  });

  it("maps provider payment status to canonical domain status", async () => {
    paymentGetMock.mockResolvedValue({
      id: 100,
      external_reference: "shipment-1",
      status: "in_process",
      payment_type_id: "credit_card",
      transaction_amount: 12345,
    });
    const { getPaymentAdapter } = await import("@/lib/payments");
    const adapter = getPaymentAdapter();
    const payment = await adapter.getPaymentById(100);
    expect(payment.status).toBe("pending");
    expect(payment.externalReference).toBe("shipment-1");
    expect(payment.amount).toBe(12345);
  });
});
