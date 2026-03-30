import { describe, expect, it, vi } from "vitest";
import { verifyDriverUseCase } from "@/lib/use-cases/drivers/verify-driver";

describe("verifyDriverUseCase", () => {
  it("stops flow when identity is rejected", async () => {
    const deps = {
      verifyIdentity: vi.fn().mockResolvedValue({
        status: "rejected",
        confidence: 40,
        rejectionReason: "mismatch",
        rawResponse: {},
      }),
      getIdentityProviderName: vi.fn().mockReturnValue("renaper"),
      saveIdentityVerification: vi.fn().mockResolvedValue(undefined),
      logAdminAction: vi.fn().mockResolvedValue(undefined),
      notifyDriverStatus: vi.fn().mockResolvedValue(undefined),
    };

    const result = await verifyDriverUseCase(deps, {
      adminUserId: "admin-1",
      driverId: "driver-1",
      action: "approve",
      docs: { dniFrontUrl: "front", dniBackUrl: "back", selfieUrl: "selfie" },
      dniNumber: "12345678",
      fullName: "Juan Perez",
      profile: null,
      isIdentityConfigured: true,
    });

    expect(result.identityRejected).toBe(true);
    expect(deps.logAdminAction).not.toHaveBeenCalled();
  });

  it("logs action and notifies when verification passes", async () => {
    const deps = {
      verifyIdentity: vi.fn().mockResolvedValue({
        status: "verified",
        confidence: 95,
        rawResponse: {},
      }),
      getIdentityProviderName: vi.fn().mockReturnValue("renaper"),
      saveIdentityVerification: vi.fn().mockResolvedValue(undefined),
      logAdminAction: vi.fn().mockResolvedValue(undefined),
      notifyDriverStatus: vi.fn().mockResolvedValue(undefined),
    };

    const result = await verifyDriverUseCase(deps, {
      adminUserId: "admin-1",
      driverId: "driver-1",
      action: "approve",
      docs: { dniFrontUrl: "front", dniBackUrl: "back", selfieUrl: "selfie" },
      dniNumber: "12345678",
      fullName: "Juan Perez",
      profile: { id: "u1", name: "Juan", email: "j@test.com", phone: "+54911" },
      isIdentityConfigured: true,
    });

    expect(result.identityRejected).toBe(false);
    expect(deps.logAdminAction).toHaveBeenCalledOnce();
    expect(deps.notifyDriverStatus).toHaveBeenCalledOnce();
  });
});
