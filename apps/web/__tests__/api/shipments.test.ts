import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/shipments/route";

const getUser = vi.fn();
const single = vi.fn();
const eq = vi.fn();
const select = vi.fn();
const from = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabase: () => ({
    auth: { getUser },
    from,
    rpc,
  }),
}));

describe("POST /api/shipments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    single.mockResolvedValue({ data: { id: "shipment-1" }, error: null });
    eq.mockReturnValue({ single });
    select.mockReturnValue({ eq });
    rpc.mockResolvedValue({ data: "shipment-1", error: null });

    from.mockImplementation((table: string) => {
      if (table === "shipments") return { select };
      return { select: vi.fn() };
    });
  });

  it("returns 400 for invalid body", async () => {
    const req = new NextRequest("http://localhost:3000/api/shipments", {
      method: "POST",
      body: JSON.stringify({ type: "mudanza", legs: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates shipment and legs for valid input", async () => {
    const req = new NextRequest("http://localhost:3000/api/shipments", {
      method: "POST",
      body: JSON.stringify({
        type: "mudanza",
        helpers: 1,
        legs: [
          {
            originAddress: "Palermo",
            originLat: -34.58,
            originLng: -58.43,
            destAddress: "Avellaneda",
            destLat: -34.66,
            destLng: -58.37,
          },
        ],
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.shipment.id).toBe("shipment-1");
    expect(json.legs).toHaveLength(1);
    expect(rpc).toHaveBeenCalledOnce();
  });
});
