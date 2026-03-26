import { describe, expect, it } from "vitest";
import {
  AUTH_PROTECTED_PREFIXES,
  isAuthProtectedPath,
  sanitizeInternalNextPath,
} from "@/lib/auth/path-utils";

describe("isAuthProtectedPath", () => {
  it("matches exact and nested paths for each prefix", () => {
    for (const prefix of AUTH_PROTECTED_PREFIXES) {
      expect(isAuthProtectedPath(prefix)).toBe(true);
      expect(isAuthProtectedPath(`${prefix}/extra`)).toBe(true);
    }
  });

  it("does not match public routes", () => {
    expect(isAuthProtectedPath("/")).toBe(false);
    expect(isAuthProtectedPath("/login")).toBe(false);
    expect(isAuthProtectedPath("/auth/callback")).toBe(false);
    expect(isAuthProtectedPath("/api/health")).toBe(false);
  });

  it("does not match partial segment collisions", () => {
    expect(isAuthProtectedPath("/dashboards")).toBe(false);
    expect(isAuthProtectedPath("/profile-settings")).toBe(false);
  });
});

describe("sanitizeInternalNextPath", () => {
  it("allows safe relative paths", () => {
    expect(sanitizeInternalNextPath("/shipment", "/dashboard")).toBe("/shipment");
    expect(sanitizeInternalNextPath("/tracking/abc", "/dashboard")).toBe("/tracking/abc");
  });

  it("rejects open redirects and falls back", () => {
    expect(sanitizeInternalNextPath("//evil.com", "/dashboard")).toBe("/dashboard");
    expect(sanitizeInternalNextPath("https://evil.com", "/dashboard")).toBe("/dashboard");
    expect(sanitizeInternalNextPath(null, "/dashboard")).toBe("/dashboard");
    expect(sanitizeInternalNextPath("", "/dashboard")).toBe("/dashboard");
  });
});
