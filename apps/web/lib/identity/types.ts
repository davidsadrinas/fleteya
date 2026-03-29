export interface VerificationRequest {
  documentType: "dni" | "license";
  documentNumber: string;
  fullName: string;
  birthDate?: string;
  gender?: "M" | "F";
  frontImageUrl: string;
  backImageUrl?: string;
  selfieUrl?: string;
}

export interface VerificationResult {
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

export interface IdentityProvider {
  readonly name: string;
  verify(request: VerificationRequest): Promise<VerificationResult>;
}
