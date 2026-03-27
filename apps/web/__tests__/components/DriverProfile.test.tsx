import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProfilePage from "@/app/(app)/profile/page";

describe("ProfilePage", () => {
  it("renders account section and settings access", () => {
    render(<ProfilePage />);
    expect(screen.getByText("Cuenta")).toBeTruthy();
    expect(screen.getByText(/Nombre:/i)).toBeTruthy();
  });

  it("keeps settings call to action", () => {
    render(<ProfilePage />);
    expect(screen.getByRole("link", { name: /configuración de cuenta/i })).toBeTruthy();
  });
});
