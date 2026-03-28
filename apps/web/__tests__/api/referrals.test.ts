/**
 * Tests for GET/POST /api/referrals — referral code management and redemption.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getUser = vi.fn();

const supabaseMock = {
  auth: { getUser },
  from: vi.fn(),
};

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabase: () => supabaseMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleSupabase: () => supabaseMock,
}));

function mockChain(data: unknown, error: unknown = null) {
  const obj: Record<string, unknown> = {};
  const terminal = { data, error };
  obj.select = vi.fn().mockReturnValue(obj);
  obj.insert = vi.fn().mockReturnValue(obj);
  obj.update = vi.fn().mockReturnValue(obj);
  obj.eq = vi.fn().mockReturnValue(obj);
  obj.order = vi.fn().mockReturnValue(obj);
  obj.single = vi.fn().mockResolvedValue(terminal);
  obj.maybeSingle = vi.fn().mockResolvedValue(terminal);
  obj.then = vi.fn().mockImplementation((cb: (v: unknown) => unknown) => Promise.resolve(cb(terminal)));
  return obj;
}

describe("GET /api/referrals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("returns existing referral code and redemptions", async () => {
    const { GET } = await import("@/app/api/referrals/route");

    let callCount = 0;
    supabaseMock.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // referral_codes query
        return mockChain({ id: "rc-1", code: "USR12345", uses: 3, max_uses: 50 });
      }
      // referral_redemptions query
      return mockChain([
        { id: "rr-1", referred_user_id: "user-2", profiles: { name: "Ana" } },
      ]);
    });

    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.code.code).toBe("USR12345");
  });

  it("rejects unauthenticated requests", async () => {
    const { GET } = await import("@/app/api/referrals/route");
    getUser.mockResolvedValue({ data: { user: null } });

    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe("POST /api/referrals (redeem)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "user-2" } } });
  });

  it("rejects unauthenticated redeem requests", async () => {
    const { POST } = await import("@/app/api/referrals/route");
    getUser.mockResolvedValue({ data: { user: null } });

    const req = new NextRequest("http://localhost/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "ABC12345" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("rejects invalid code format", async () => {
    const { POST } = await import("@/app/api/referrals/route");

    const req = new NextRequest("http://localhost/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "AB" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("prevents duplicate redemption (user already redeemed)", async () => {
    const { POST } = await import("@/app/api/referrals/route");

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === "referral_redemptions") {
        // User already has a redemption
        return mockChain({ id: "existing-redemption" });
      }
      return mockChain(null);
    });

    const req = new NextRequest("http://localhost/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "VALID123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("prevents self-referral", async () => {
    const { POST } = await import("@/app/api/referrals/route");

    let callCount = 0;
    supabaseMock.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // No existing redemption
        return mockChain(null);
      }
      // Code belongs to same user
      return mockChain({
        id: "rc-1",
        code: "USR12345",
        user_id: "user-2", // same as authenticated user
        active: true,
        uses: 0,
        max_uses: 50,
        reward_amount: 500,
      });
    });

    const req = new NextRequest("http://localhost/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "USR12345" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects non-existent code", async () => {
    const { POST } = await import("@/app/api/referrals/route");

    supabaseMock.from.mockImplementation(() => mockChain(null));

    const req = new NextRequest("http://localhost/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "DOESNOTEXIST" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});
