import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TrackingPage from "@/app/(app)/tracking/page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("shipmentId=test-shipment"),
}));

describe("TrackingPage", () => {
  it("renders realtime tracking headline and timeline states", () => {
    render(<TrackingPage />);

    expect(screen.getByRole("heading", { name: /tracking en vivo/i })).toBeTruthy();
    expect(screen.getAllByText("Pendiente").length).toBeGreaterThan(0);
    expect(screen.getAllByText("En tránsito").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Entregado").length).toBeGreaterThan(0);
  });

  it("shows realtime integration hint", () => {
    render(<TrackingPage />);
    expect(screen.getByText(/supabase realtime/i)).toBeTruthy();
  });
});
