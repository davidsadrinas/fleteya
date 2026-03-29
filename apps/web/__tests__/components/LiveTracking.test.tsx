import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import TrackingPage from "@/app/(app)/tracking/page";

let mockParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockParams,
}));

describe("TrackingPage", () => {
  beforeEach(() => {
    mockParams = new URLSearchParams("");
  });

  it("shows empty state when no shipment ID", () => {
    render(<TrackingPage />);

    expect(screen.getByRole("heading", { name: /tracking en vivo/i })).toBeTruthy();
    expect(screen.getByText(/no tenés envios activos/i)).toBeTruthy();
  });

  it("shows inactive message when shipment status is not active", () => {
    mockParams = new URLSearchParams("shipmentId=test-shipment-1234");
    render(<TrackingPage />);

    expect(screen.getByRole("heading", { name: /envio #test-shi/i })).toBeTruthy();
    expect(screen.getByText(/el mapa interactivo se activa/i)).toBeTruthy();
  });
});
