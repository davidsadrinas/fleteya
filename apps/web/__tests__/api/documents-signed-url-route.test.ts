import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/documents/signed-url/route";

const getUser = vi.fn();
const canAccessShipment = vi.fn();
const createSignedUrl = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabase: () => ({
    auth: { getUser },
    storage: { from },
  }),
}));

vi.mock("@/lib/shipments/access", () => ({
  canAccessShipment: (...args: Parameters<typeof canAccessShipment>) =>
    canAccessShipment(...args),
}));

describe("API /documents/signed-url", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    canAccessShipment.mockResolvedValue({ allowed: true, driverUserId: "u1" });
    createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed-url.local/file" },
      error: null,
    });
    from.mockReturnValue({ createSignedUrl });
  });

  it("returns signed url for shipment evidence participant", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/documents/signed-url?bucket=shipment-evidence&path=s1/file.jpg&shipmentId=s1"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.signedUrl).toContain("https://signed-url.local");
  });

  it("blocks cross-user dni-documents path", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/documents/signed-url?bucket=dni-documents&path=other-user/file.jpg"
    );
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
