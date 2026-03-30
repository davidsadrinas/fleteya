export interface IdentityVerificationRequest {
  documentType: "dni" | "license";
  documentNumber: string;
  fullName: string;
  birthDate?: string;
  gender?: "M" | "F";
  frontImageUrl: string;
  backImageUrl?: string;
  selfieUrl?: string;
}

export interface IdentityVerificationResult {
  status: "verified" | "rejected" | "error";
  confidence: number;
  rejectionReason?: string;
  rawResponse: Record<string, unknown>;
  matchDetails: {
    nameMatch: boolean;
    numberMatch: boolean;
    faceMatch?: boolean;
    documentExpired: boolean;
  };
}

export interface IdentityVerificationAdapter {
  readonly name: string;
  isConfigured(): boolean;
  verify(
    request: IdentityVerificationRequest
  ): Promise<IdentityVerificationResult>;
}

// Backward-compatible aliases to avoid breaking current imports.
export type VerificationRequest = IdentityVerificationRequest;
export type VerificationResult = IdentityVerificationResult;
export type IdentityProvider = IdentityVerificationAdapter;
