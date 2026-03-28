import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "@/app/api/shipments/[id]/status/route";

const getUser = vi.fn();
const canAccessShipment = vi.fn();
const maybeSingle = vi.fn();
const eq = vi.fn();
const select = vi.fn();
const updateEq = vi.fn();
const update = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabase: () => ({
    auth: { getUser },
    from,
  }),
}));

vi.mock("@/lib/shipments/access", () => ({
  canAccessShipment: (...args: Parameters<typeof canAccessShipment>) =>
    canAccessShipment(...args),
}));

describe("API /shipments/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    canAccessShipment.mockResolvedValue({ allowed: true, driverUserId: "u1" });

    maybeSingle.mockResolvedValue({
      data: { id: "s1", status: "assigned", client_id: "client-1" },
      error: null,
    });
    eq.mockReturnValue({ maybeSingle });
    select.mockReturnValue({ eq });

    updateEq.mockResolvedValue({ error: null });
    update.mockReturnValue({ eq: updateEq });
    from.mockReturnValue({ select, update });
  });

  it("returns 401 without user session", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest("http://localhost:3000/api/shipments/s1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "at_origin" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "s1" }) });
    expect(res.status).toBe(401);
  });

  it("updates status for assigned driver with valid transition", async () => {
    const req = new NextRequest("http://localhost:3000/api/shipments/s1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "at_origin" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "s1" }) });
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "at_origin" })
    );
  });

  it("rejects invalid transition", async () => {
    const req = new NextRequest("http://localhost:3000/api/shipments/s1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "delivered" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "s1" }) });
    expect(res.status).toBe(400);
  });
});
