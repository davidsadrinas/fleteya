import { beforeEach, describe, expect, it, vi } from "vitest";

describe("identity adapter abstraction", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.RENAPER_PROVIDER = "renaper";
  });

  it("resolves RENAPER adapter name from configuration", async () => {
    const { getIdentityProviderName } = await import("@/lib/identity");
    expect(getIdentityProviderName()).toBe("renaper");
  });

  it("keeps backward compatibility for legacy nosis provider flag", async () => {
    process.env.RENAPER_PROVIDER = "nosis";
    const { getIdentityProviderName } = await import("@/lib/identity");
    expect(getIdentityProviderName()).toBe("renaper");
  });

  it("reports not configured when RENAPER credentials are missing", async () => {
    delete process.env.RENAPER_API_KEY;
    delete process.env.RENAPER_API_URL;
    const { isIdentityConfigured } = await import("@/lib/identity");
    expect(isIdentityConfigured()).toBe(false);
  });

  it("returns error result when adapter is selected but not configured", async () => {
    delete process.env.RENAPER_API_KEY;
    delete process.env.RENAPER_API_URL;
    const { verifyIdentity } = await import("@/lib/identity");
    const result = await verifyIdentity({
      documentType: "dni",
      documentNumber: "12345678",
      fullName: "Juan Perez",
      frontImageUrl: "https://bucket/front.jpg",
      backImageUrl: "https://bucket/back.jpg",
      selfieUrl: "https://bucket/selfie.jpg",
    });
    expect(result.status).toBe("error");
    expect(result.confidence).toBe(0);
  });
});
