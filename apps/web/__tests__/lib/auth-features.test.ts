import { afterEach, describe, expect, it, vi } from "vitest";
import { isFacebookLoginEnabled } from "@/lib/config/auth-features";

describe("auth-features", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("disables Facebook login by default", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH", "");
    expect(isFacebookLoginEnabled()).toBe(false);
  });

  it("enables Facebook login when NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH is true", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH", "true");
    expect(isFacebookLoginEnabled()).toBe(true);
  });

  it("treats non-true values as disabled", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH", "1");
    expect(isFacebookLoginEnabled()).toBe(false);
  });
});
