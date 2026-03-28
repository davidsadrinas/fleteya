import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ShipmentConfirmationPage from "@/app/(app)/shipment/confirmation/page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "shipmentId") return "ship-12345";
      if (key === "price") return "12345";
      return null;
    },
  }),
}));

vi.mock("@/lib/supabase-client", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === "shipment_legs") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: [], error: null }),
            }),
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    },
  }),
}));

describe("ShipmentConfirmationPage", () => {
  it("renders reservation confirmation and calendar actions", async () => {
    render(<ShipmentConfirmationPage />);
    expect(await screen.findByText(/Reserva confirmada/i)).toBeTruthy();
    expect(screen.getByText(/Notificaciones enviadas/i)).toBeTruthy();
    expect(screen.getByText(/Agregar al calendario/i)).toBeTruthy();
    expect(screen.getByText(/Google Calendar/i)).toBeTruthy();
  });
});
