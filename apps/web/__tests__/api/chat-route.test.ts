import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/shipments/[id]/chat/route";

const getUser = vi.fn();
const canAccessShipment = vi.fn();
const enforceRateLimit = vi.fn();
const getRequesterIp = vi.fn();
const single = vi.fn();
const select = vi.fn();
const insert = vi.fn();
const limit = vi.fn();
const order = vi.fn();
const eq = vi.fn();
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

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: (...args: Parameters<typeof enforceRateLimit>) =>
    enforceRateLimit(...args),
  getRequesterIp: (...args: Parameters<typeof getRequesterIp>) =>
    getRequesterIp(...args),
}));

describe("API /shipments/[id]/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    canAccessShipment.mockResolvedValue({ allowed: true, driverUserId: null });
    enforceRateLimit.mockReturnValue({ ok: true, retryAfterSeconds: 10, remaining: 10 });
    getRequesterIp.mockReturnValue("1.2.3.4");

    limit.mockResolvedValue({ data: [{ id: "m1", body: "hola" }], error: null });
    order.mockReturnValue({ limit });
    eq.mockReturnValue({ order });
    select.mockReturnValue({ eq, single });

    single.mockResolvedValue({ data: { id: "m1", body: "hola" }, error: null });
    insert.mockReturnValue({ select });
    from.mockReturnValue({ select, insert });
  });

  it("GET returns 401 without session", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest("http://localhost:3000/api/shipments/s1/chat");
    const res = await GET(req, { params: Promise.resolve({ id: "s1" }) });
    expect(res.status).toBe(401);
  });

  it("GET returns messages for participant", async () => {
    const req = new NextRequest("http://localhost:3000/api/shipments/s1/chat");
    const res = await GET(req, { params: Promise.resolve({ id: "s1" }) });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.messages[0].id).toBe("m1");
  });

  it("POST creates message", async () => {
    const req = new NextRequest("http://localhost:3000/api/shipments/s1/chat", {
      method: "POST",
      body: JSON.stringify({ body: "  hola  ", quickTag: "quick" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "s1" }) });
    expect(res.status).toBe(201);
    expect(insert).toHaveBeenCalled();
  });

  it("POST returns 429 when limited", async () => {
    enforceRateLimit.mockReturnValue({ ok: false, retryAfterSeconds: 3, remaining: 0 });
    const req = new NextRequest("http://localhost:3000/api/shipments/s1/chat", {
      method: "POST",
      body: JSON.stringify({ body: "hola" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "s1" }) });
    expect(res.status).toBe(429);
  });
});
