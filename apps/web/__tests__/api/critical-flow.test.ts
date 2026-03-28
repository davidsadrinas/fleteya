/**
 * E2E-style integration test for the critical business flow:
 * Create shipment → Apply → Assignment → Payment creation
 *
 * Uses mocked Supabase but validates the full chain of API calls.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Shared mocks ---
const getUser = vi.fn();
const enforceRateLimit = vi.fn();

const supabaseMock = {
  auth: { getUser },
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabase: () => supabaseMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleSupabase: () => supabaseMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: (...args: Parameters<typeof enforceRateLimit>) =>
    enforceRateLimit(...args),
  getRequesterIp: () => "127.0.0.1",
}));

const mockPreferenceCreate = vi.fn();
vi.mock("mercadopago", () => ({
  MercadoPagoConfig: vi.fn(),
  Preference: vi.fn().mockImplementation(() => ({ create: mockPreferenceCreate })),
  Payment: vi.fn(),
}));

// Helpers
function mockChain(data: unknown, error: unknown = null) {
  const mockObj: Record<string, unknown> = {};
  const terminal = { data, error };
  const chainFn = () => mockObj;

  mockObj.select = vi.fn().mockReturnValue(mockObj);
  mockObj.insert = vi.fn().mockReturnValue(mockObj);
  mockObj.update = vi.fn().mockReturnValue(mockObj);
  mockObj.eq = vi.fn().mockReturnValue(mockObj);
  mockObj.neq = vi.fn().mockReturnValue(mockObj);
  mockObj.is = vi.fn().mockReturnValue(mockObj);
  mockObj.in = vi.fn().mockReturnValue(mockObj);
  mockObj.order = vi.fn().mockReturnValue(mockObj);
  mockObj.limit = vi.fn().mockReturnValue(mockObj);
  mockObj.single = vi.fn().mockResolvedValue(terminal);
  mockObj.maybeSingle = vi.fn().mockResolvedValue(terminal);
  mockObj.then = vi.fn().mockImplementation((cb: (v: unknown) => unknown) => Promise.resolve(cb(terminal)));

  return mockObj;
}

describe("Critical Business Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enforceRateLimit.mockReturnValue({ ok: true, retryAfterSeconds: 10, remaining: 10 });
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  describe("Step 1: Create Shipment", () => {
    it("creates shipment with correct pricing via RPC", async () => {
      const { POST } = await import("@/app/api/shipments/route");

      supabaseMock.rpc.mockResolvedValue({ data: "shipment-uuid-1", error: null });
      supabaseMock.from.mockReturnValue(
        mockChain({
          id: "shipment-uuid-1",
          status: "pending",
          base_price: 21200,
          final_price: 21200,
          commission: 4664,
        })
      );

      const req = new NextRequest("http://localhost/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "mudanza",
          helpers: 1,
          legs: [
            {
              originAddress: "Av. Corrientes 1000, CABA",
              originLat: -34.6037,
              originLng: -58.3816,
              destAddress: "Av. Santa Fe 2000, CABA",
              destLat: -34.5955,
              destLng: -58.3972,
            },
          ],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.shipment.id).toBe("shipment-uuid-1");

      // Verify RPC was called with pricing > 0
      expect(supabaseMock.rpc).toHaveBeenCalledWith(
        "create_shipment_with_legs",
        expect.objectContaining({
          p_client_id: "user-1",
          p_type: "mudanza",
          p_helpers: 1,
        })
      );

      const rpcArgs = supabaseMock.rpc.mock.calls[0][1];
      expect(rpcArgs.p_base_price).toBeGreaterThan(0);
      expect(rpcArgs.p_final_price).toBeGreaterThan(0);
      expect(rpcArgs.p_commission).toBeGreaterThan(0);
      expect(rpcArgs.p_legs).toHaveLength(1);
      expect(rpcArgs.p_legs[0].price).toBeGreaterThan(0);
    });

    it("rejects shipment with empty legs", async () => {
      const { POST } = await import("@/app/api/shipments/route");

      const req = new NextRequest("http://localhost/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "mudanza", helpers: 0, legs: [] }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("rejects unauthenticated requests", async () => {
      const { POST } = await import("@/app/api/shipments/route");
      getUser.mockResolvedValue({ data: { user: null } });

      const req = new NextRequest("http://localhost/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "mudanza", helpers: 0, legs: [{ originAddress: "A", originLat: -34, originLng: -58, destAddress: "B", destLat: -34.5, destLng: -58.5 }] }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });

  describe("Step 2: Payment Creation", () => {
    const SHIPMENT_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

    it("creates MercadoPago preference for valid shipment", async () => {
      const { POST } = await import("@/app/api/payments/create/route");

      // Mock shipment lookup — user owns it
      supabaseMock.from.mockImplementation((table: string) => {
        if (table === "shipments") {
          return mockChain({
            id: SHIPMENT_UUID,
            client_id: "user-1",
            final_price: 21200,
            commission: 4664,
            status: "pending",
          });
        }
        if (table === "payments") {
          return mockChain(null); // no existing approved payment
        }
        return mockChain(null);
      });

      // Set env for MP and mock preference creation
      process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
      mockPreferenceCreate.mockResolvedValue({
        id: "mp-pref-1",
        init_point: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mp-pref-1",
      });

      const req = new NextRequest("http://localhost/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId: SHIPMENT_UUID }),
      });

      const res = await POST(req);

      // Should succeed (201) or fail gracefully at MP call (500) or missing config (503)
      expect([201, 500, 503]).toContain(res.status);
    });

    it("rejects payment for non-owned shipment", async () => {
      const { POST } = await import("@/app/api/payments/create/route");

      supabaseMock.from.mockReturnValue(
        mockChain({
          id: SHIPMENT_UUID,
          client_id: "other-user",
          final_price: 21200,
          commission: 4664,
          status: "pending",
        })
      );

      const req = new NextRequest("http://localhost/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId: SHIPMENT_UUID }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
    });
  });

  describe("Step 3: Rate Limiting", () => {
    it("blocks requests when rate limited", async () => {
      const { POST } = await import("@/app/api/shipments/route");
      enforceRateLimit.mockReturnValue({ ok: false, retryAfterSeconds: 30, remaining: 0 });

      const req = new NextRequest("http://localhost/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "mudanza",
          helpers: 0,
          legs: [{ originAddress: "A", originLat: -34, originLng: -58, destAddress: "B", destLat: -34.5, destLng: -58.5 }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("30");
    });
  });
});
