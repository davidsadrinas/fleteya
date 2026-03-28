/**
 * Tests for POST /api/quote — instant quote calculation (no auth required).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const enforceRateLimit = vi.fn();
const supabaseMock = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/admin", () => ({
  createAnonSupabase: () => supabaseMock,
  createServiceRoleSupabase: () => supabaseMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: (...args: Parameters<typeof enforceRateLimit>) =>
    enforceRateLimit(...args),
  getRequesterIp: () => "127.0.0.1",
}));

function mockInsertChain(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data, error });
  return chain;
}

describe("POST /api/quote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enforceRateLimit.mockReturnValue({ ok: true, retryAfterSeconds: 10, remaining: 10 });
    supabaseMock.from.mockReturnValue(
      mockInsertChain({ id: "quote-1", session_token: "tok-abc" })
    );
  });

  it("returns pricing for a single-leg quote", async () => {
    const { POST } = await import("@/app/api/quote/route");

    const req = new NextRequest("http://localhost/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.legs).toHaveLength(1);
    expect(json.basePrice).toBeGreaterThan(0);
    expect(json.finalPrice).toBeGreaterThan(0);
    expect(json.commission).toBeGreaterThan(0);
    expect(json.savings).toBeGreaterThanOrEqual(0);
    expect(json.quoteId).toBe("quote-1");
    expect(json.sessionToken).toBe("tok-abc");
  });

  it("applies chain discount for multi-leg quotes", async () => {
    const { POST } = await import("@/app/api/quote/route");

    const leg = {
      originAddress: "Origen test",
      originLat: -34.6,
      originLng: -58.4,
      destAddress: "Destino test",
      destLat: -34.7,
      destLng: -58.5,
    };

    const req = new NextRequest("http://localhost/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legs: [leg, { ...leg, originAddress: "Destino test", destAddress: "Otro destino" }] }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(json.legs).toHaveLength(2);
    // Second leg should have a discount > 0
    expect(json.legs[1].discount).toBeGreaterThan(0);
    expect(json.savings).toBeGreaterThan(0);
  });

  it("rejects empty legs", async () => {
    const { POST } = await import("@/app/api/quote/route");

    const req = new NextRequest("http://localhost/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legs: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects invalid coordinates", async () => {
    const { POST } = await import("@/app/api/quote/route");

    const req = new NextRequest("http://localhost/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legs: [
          {
            originAddress: "A",
            originLat: 999,
            originLng: -58.4,
            destAddress: "B",
            destLat: -34.5,
            destLng: -58.5,
          },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("enforces rate limiting", async () => {
    const { POST } = await import("@/app/api/quote/route");
    enforceRateLimit.mockReturnValue({ ok: false, retryAfterSeconds: 60, remaining: 0 });

    const req = new NextRequest("http://localhost/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legs: [
          {
            originAddress: "A",
            originLat: -34.6,
            originLng: -58.4,
            destAddress: "B",
            destLat: -34.5,
            destLng: -58.5,
          },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });
});
