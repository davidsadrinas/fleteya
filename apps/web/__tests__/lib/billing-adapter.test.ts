import { beforeEach, describe, expect, it, vi } from "vitest";

describe("billing adapter resolution", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.BILLING_PROVIDER;
    delete process.env.AFIP_CUIT;
  });

  it("returns AFIP adapter by default", async () => {
    const { getBillingAdapter } = await import("@/lib/billing");
    const adapter = getBillingAdapter();
    expect(adapter.name).toBe("afip");
    expect(adapter.isConfigured()).toBe(false);
  });
});
