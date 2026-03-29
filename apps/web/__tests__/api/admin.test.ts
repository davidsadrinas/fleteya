/**
 * Tests for admin API routes — stats, driver verification.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getUser = vi.fn();

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

function mockChain(data: unknown, error: unknown = null) {
  const obj: Record<string, unknown> = {};
  const terminal = { data, error };
  obj.select = vi.fn().mockReturnValue(obj);
  obj.insert = vi.fn().mockReturnValue(obj);
  obj.update = vi.fn().mockReturnValue(obj);
  obj.eq = vi.fn().mockReturnValue(obj);
  obj.neq = vi.fn().mockReturnValue(obj);
  obj.is = vi.fn().mockReturnValue(obj);
  obj.in = vi.fn().mockReturnValue(obj);
  obj.gte = vi.fn().mockReturnValue(obj);
  obj.lte = vi.fn().mockReturnValue(obj);
  obj.order = vi.fn().mockReturnValue(obj);
  obj.range = vi.fn().mockReturnValue(obj);
  obj.limit = vi.fn().mockReturnValue(obj);
  obj.single = vi.fn().mockResolvedValue(terminal);
  obj.maybeSingle = vi.fn().mockResolvedValue(terminal);
  obj.then = vi.fn().mockImplementation((cb: (v: unknown) => unknown) =>
    Promise.resolve(cb(terminal))
  );
  return obj;
}

function setupAdmin() {
  getUser.mockResolvedValue({ data: { user: { id: "admin-1", email: "david.sadrinas@gmail.com" } } });
  supabaseMock.from.mockReturnValue(mockChain([]));
}

function setupNonAdmin() {
  getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "other@example.com" } } });
  supabaseMock.from.mockReturnValue(mockChain([]));
}

describe("GET /api/admin/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns stats for admin users", async () => {
    setupAdmin();
    supabaseMock.rpc.mockResolvedValue({
      data: { total_shipments: 100, total_revenue: 500000 },
      error: null,
    });

    const { GET } = await import("@/app/api/admin/stats/route");
    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.stats).toBeDefined();
    expect(json.stats.total_shipments).toBe(100);
  });

  it("rejects non-admin users", async () => {
    setupNonAdmin();

    const { GET } = await import("@/app/api/admin/stats/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("rejects unauthenticated requests", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import("@/app/api/admin/stats/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("handles RPC errors", async () => {
    setupAdmin();
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { message: "Function not found" },
    });

    const { GET } = await import("@/app/api/admin/stats/route");
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
