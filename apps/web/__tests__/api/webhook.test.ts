/**
 * Tests for POST /api/payments/webhook — MercadoPago webhook handler.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createHmac } from "crypto";

const enforceRateLimit = vi.fn();
const supabaseMock = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleSupabase: () => supabaseMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: (...args: Parameters<typeof enforceRateLimit>) =>
    enforceRateLimit(...args),
  getRequesterIp: () => "127.0.0.1",
}));

// Mock mercadopago — prevent real HTTP calls
const mockMPGet = vi.fn();
vi.mock("mercadopago", () => ({
  MercadoPagoConfig: vi.fn(),
  Payment: vi.fn().mockImplementation(() => ({ get: mockMPGet })),
}));

function mockUpdateChain(data: unknown = null, error: unknown = null) {
  const obj: Record<string, unknown> = {};
  obj.update = vi.fn().mockReturnValue(obj);
  obj.eq = vi.fn().mockReturnValue(obj);
  obj.then = vi.fn().mockImplementation((cb: (v: unknown) => unknown) =>
    Promise.resolve(cb({ data, error }))
  );
  return obj;
}

function makeWebhookBody(paymentId: string | number) {
  return {
    type: "payment",
    action: "payment.created",
    data: { id: paymentId },
  };
}

function signRequest(body: Record<string, unknown>, secret: string, requestId = "req-1") {
  const ts = String(Date.now());
  const dataId = String((body.data as Record<string, unknown>)?.id ?? "");
  const manifest = `id=${dataId};request-id=${requestId};ts=${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
  return { ts, v1, requestId };
}

describe("POST /api/payments/webhook", () => {
  const WEBHOOK_SECRET = "test-webhook-secret";

  beforeEach(() => {
    vi.clearAllMocks();
    enforceRateLimit.mockReturnValue({ ok: true, retryAfterSeconds: 10, remaining: 100 });
    process.env.MERCADOPAGO_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
  });

  it("rejects invalid signature", async () => {
    const { POST } = await import("@/app/api/payments/webhook/route");

    const body = makeWebhookBody("12345");
    const req = new NextRequest("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": "ts=123,v1=invalidsignature",
        "x-request-id": "req-1",
      },
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("accepts valid signature and processes approved payment", async () => {
    const { POST } = await import("@/app/api/payments/webhook/route");

    const body = makeWebhookBody("67890");
    const { ts, v1, requestId } = signRequest(body, WEBHOOK_SECRET);

    mockMPGet.mockResolvedValue({
      id: 67890,
      status: "approved",
      external_reference: "shipment-uuid-1",
      payment_type_id: "credit_card",
    });

    supabaseMock.from.mockReturnValue(mockUpdateChain());

    const req = new NextRequest("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": `ts=${ts},v1=${v1}`,
        "x-request-id": requestId,
      },
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("rate limits webhook requests", async () => {
    const { POST } = await import("@/app/api/payments/webhook/route");
    enforceRateLimit.mockReturnValue({ ok: false, retryAfterSeconds: 10, remaining: 0 });

    const req = new NextRequest("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(makeWebhookBody("99")),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("gracefully handles non-payment events", async () => {
    const { POST } = await import("@/app/api/payments/webhook/route");

    // Without webhook secret to skip signature check
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;

    const req = new NextRequest("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "plan", action: "plan.created", data: { id: "p1" } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockMPGet).not.toHaveBeenCalled();
  });

  it("handles missing body gracefully", async () => {
    const { POST } = await import("@/app/api/payments/webhook/route");

    const req = new NextRequest("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{",
    });

    const res = await POST(req);
    expect(res.status).toBe(200); // Returns ok: true for malformed bodies
  });
});
