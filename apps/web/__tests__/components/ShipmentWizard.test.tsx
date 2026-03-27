import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ShipmentPage from "@/app/(app)/shipment/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe("ShipmentPage (wizard placeholder)", () => {
  beforeEach(() => {
    // Prevent store state leakage between tests.
    window.localStorage.clear();
  });

  it("renders the 4-step shipment flow copy", () => {
    render(<ShipmentPage />);

    expect(screen.getByRole("heading", { name: /nuevo envío/i })).toBeTruthy();
    expect(screen.getByText(/paso 1 de 4/i)).toBeTruthy();
    expect(screen.getByText("Ruta")).toBeTruthy();
    expect(screen.getByRole("button", { name: /siguiente/i })).toBeTruthy();
  });

  it("keeps dashboard return link visible", () => {
    render(<ShipmentPage />);
    expect(screen.getByRole("link", { name: /volver al inicio/i })).toBeTruthy();
  });
});
