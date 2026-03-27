import { describe, expect, it, vi } from "vitest";
import { canAccessShipment } from "@/lib/shipments/access";

function mockSupabase(input: {
  shipment?: { id: string; client_id: string; driver_id: string | null } | null;
  shipmentError?: { message: string } | null;
  driver?: { user_id: string } | null;
}) {
  const maybeSingle = vi
    .fn()
    .mockResolvedValueOnce({ data: input.shipment ?? null, error: input.shipmentError ?? null })
    .mockResolvedValueOnce({ data: input.driver ?? null, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as Parameters<typeof canAccessShipment>[0];
}

describe("canAccessShipment", () => {
  it("allows client owner", async () => {
    const supabase = mockSupabase({
      shipment: { id: "s1", client_id: "u1", driver_id: null },
    });
    const out = await canAccessShipment(supabase, "s1", "u1");
    expect(out.allowed).toBe(true);
  });

  it("allows assigned driver user", async () => {
    const supabase = mockSupabase({
      shipment: { id: "s1", client_id: "u1", driver_id: "d1" },
      driver: { user_id: "driver-user-1" },
    });
    const out = await canAccessShipment(supabase, "s1", "driver-user-1");
    expect(out.allowed).toBe(true);
    expect(out.driverUserId).toBe("driver-user-1");
  });

  it("denies unrelated user", async () => {
    const supabase = mockSupabase({
      shipment: { id: "s1", client_id: "u1", driver_id: "d1" },
      driver: { user_id: "driver-user-1" },
    });
    const out = await canAccessShipment(supabase, "s1", "u-x");
    expect(out.allowed).toBe(false);
  });
});
