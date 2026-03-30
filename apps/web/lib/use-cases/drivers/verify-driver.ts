type IdentityVerification = {
  status: "verified" | "rejected" | "error";
  confidence: number;
  rejectionReason?: string;
  rawResponse: Record<string, unknown>;
};

type DriverDocs = {
  dniFrontUrl: string | null;
  dniBackUrl: string | null;
  selfieUrl: string | null;
};

type DriverProfile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

export interface VerifyDriverDeps {
  verifyIdentity: (input: {
    dniNumber: string;
    fullName: string;
    docs: DriverDocs;
  }) => Promise<IdentityVerification>;
  getIdentityProviderName: () => string;
  saveIdentityVerification: (input: {
    driverId: string;
    provider: string;
    dniNumber: string;
    verification: IdentityVerification;
  }) => Promise<void>;
  logAdminAction: (input: {
    adminUserId: string;
    driverId: string;
    action: "approve" | "reject";
    reason?: string;
  }) => Promise<void>;
  notifyDriverStatus: (input: {
    profile: DriverProfile;
    action: "approve" | "reject";
    reason?: string;
  }) => Promise<void>;
}

export async function verifyDriverUseCase(
  deps: VerifyDriverDeps,
  input: {
    adminUserId: string;
    driverId: string;
    action: "approve" | "reject";
    reason?: string;
    dniNumber?: string;
    fullName?: string;
    docs: DriverDocs;
    profile: DriverProfile | null;
    isIdentityConfigured: boolean;
  }
): Promise<{
  identityRejected: boolean;
  rejectionReason?: string;
  confidence?: number;
}> {
  if (input.action === "approve" && input.isIdentityConfigured && input.dniNumber) {
    const verification = await deps.verifyIdentity({
      dniNumber: input.dniNumber,
      fullName: input.fullName ?? "",
      docs: input.docs,
    });
    await deps.saveIdentityVerification({
      driverId: input.driverId,
      provider: deps.getIdentityProviderName(),
      dniNumber: input.dniNumber,
      verification,
    });
    if (verification.status === "rejected") {
      return {
        identityRejected: true,
        rejectionReason: verification.rejectionReason,
        confidence: verification.confidence,
      };
    }
  }

  await deps.logAdminAction({
    adminUserId: input.adminUserId,
    driverId: input.driverId,
    action: input.action,
    reason: input.reason,
  });

  if (input.profile) {
    await deps.notifyDriverStatus({
      profile: input.profile,
      action: input.action,
      reason: input.reason,
    });
  }

  return { identityRejected: false };
}
