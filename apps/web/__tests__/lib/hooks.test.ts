import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const onAuthStateChange = vi.fn();
const removeChannel = vi.fn();
const updatePosition = vi.fn();
const select = vi.fn();
const eq = vi.fn();
const from = vi.fn();
const channel = vi.fn();

let trackingInsertHandler: ((payload: { new: { location?: string } }) => void) | undefined;
let statusUpdateHandler: ((payload: { new: { status?: string } }) => void) | undefined;
let useSession: typeof import("@/lib/hooks").useSession;
let useSupabaseQuery: typeof import("@/lib/hooks").useSupabaseQuery;
let useRealtimeTracking: typeof import("@/lib/hooks").useRealtimeTracking;
let useRealtimeShipmentStatus: typeof import("@/lib/hooks").useRealtimeShipmentStatus;

vi.mock("@/lib/stores", () => ({
  useTrackingStore: () => ({ updatePosition }),
}));

vi.mock("@/lib/supabase-client", () => ({
  createClient: () => ({
    auth: { getSession, onAuthStateChange },
    from,
    channel,
    removeChannel,
  }),
}));

describe("hooks", () => {
  beforeAll(async () => {
    const hooks = await import("@/lib/hooks");
    useSession = hooks.useSession;
    useSupabaseQuery = hooks.useSupabaseQuery;
    useRealtimeTracking = hooks.useRealtimeTracking;
    useRealtimeShipmentStatus = hooks.useRealtimeShipmentStatus;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    trackingInsertHandler = undefined;
    statusUpdateHandler = undefined;

    getSession.mockResolvedValue({
      data: { session: { user: { id: "u1", email: "test@fletaya.com" } } },
    });
    onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    eq.mockResolvedValue({ data: [{ id: "1", name: "A" }], error: null });
    select.mockReturnValue({ data: [{ id: "1", name: "A" }], error: null, eq });
    from.mockReturnValue({ select });

    channel.mockImplementation((name: string) => ({
      on: (
        _event: string,
        _filter: Record<string, string>,
        handler: (payload: { new: { location?: string; status?: string } }) => void
      ) => {
        if (name.startsWith("tracking:")) trackingInsertHandler = handler as typeof trackingInsertHandler;
        if (name.startsWith("shipment:")) statusUpdateHandler = handler as typeof statusUpdateHandler;
        return { subscribe: () => ({}) };
      },
      subscribe: () => ({}),
    }));
  });

  it("useSession returns current user session", async () => {
    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user?.email).toBe("test@fletaya.com");
    });
  });

  it("useSupabaseQuery fetches rows when enabled", async () => {
    const { result } = renderHook(() => useSupabaseQuery<{ id: string; name: string }>("profiles"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data?.[0]?.name).toBe("A");
    });
    expect(from).toHaveBeenCalledWith("profiles");
  });

  it("useRealtimeTracking parses POINT payload and updates store", async () => {
    renderHook(() => useRealtimeTracking("shipment-1"));
    expect(trackingInsertHandler).toBeTypeOf("function");

    act(() => {
      trackingInsertHandler?.({ new: { location: "POINT(-58.38 -34.60)" } });
    });

    expect(updatePosition).toHaveBeenCalledWith({ lng: -58.38, lat: -34.6 });
  });

  it("useRealtimeShipmentStatus reflects shipment updates", async () => {
    const { result } = renderHook(() => useRealtimeShipmentStatus("shipment-1"));
    expect(statusUpdateHandler).toBeTypeOf("function");

    act(() => {
      statusUpdateHandler?.({ new: { status: "in_transit" } });
    });

    await waitFor(() => {
      expect(result.current).toBe("in_transit");
    });
  });
});
