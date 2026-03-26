import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import LoginPage from "@/app/login/page";

const signInWithOAuth = vi.fn();
const signInWithOtp = vi.fn();

vi.mock("@/lib/supabase-client", () => ({
  createClient: () => ({
    auth: { signInWithOAuth, signInWithOtp },
  }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams({
      next: "/shipment",
      role: "client",
    }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    signInWithOAuth.mockReset();
    signInWithOtp.mockReset();
    signInWithOAuth.mockResolvedValue({ error: null });
    signInWithOtp.mockResolvedValue({ error: null });
    vi.stubGlobal("location", {
      ...window.location,
      origin: "http://localhost:3000",
    });
  });

  it("renders branding and Google + email (Facebook hidden without flag)", async () => {
    render(<LoginPage />);
    expect(screen.getByText("flete")).toBeTruthy();
    expect(screen.getByText("ya")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /ingresar/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /google/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /facebook/i })).toBeNull();
  });

  it("shows Facebook when NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH is true", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH", "true");
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /facebook/i })).toBeTruthy();
  });

  it("starts Google OAuth when clicking the Google button", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole("button", { name: /google/i }));
    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: expect.stringContaining("/auth/callback"),
        },
      });
    });
    const call = signInWithOAuth.mock.calls[0][0] as {
      options: { redirectTo: string };
    };
    expect(decodeURIComponent(call.options.redirectTo)).toContain("/shipment");
  });

  it("starts Facebook OAuth when the flag is on and the button is clicked", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH", "true");
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole("button", { name: /facebook/i }));
    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "facebook",
        options: {
          redirectTo: expect.stringContaining("/auth/callback"),
        },
      });
    });
  });

  it("submits magic link for valid email", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email/i), "user@test.com");
    await user.click(screen.getByRole("button", { name: /enlace mágico/i }));
    await waitFor(() => {
      expect(signInWithOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "user@test.com",
          options: {
            emailRedirectTo: expect.stringContaining("/auth/callback"),
          },
        })
      );
    });
  });
});
