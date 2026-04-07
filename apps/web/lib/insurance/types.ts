export interface QuoteParams {
  declaredValue: number;
  shipmentType: string;
  distanceKm: number;
  coverageType: "basic" | "full" | "fragile";
}

export interface InsuranceQuote {
  premium: number;
  deductible: number;
  coverageDetails: string;
  providerId?: string;
}

export interface PolicyResult {
  success: boolean;
  policyNumber?: string;
  externalId?: string;
  error?: string;
}

export interface InsuranceAdapter {
  isConfigured(): boolean;
  quote(params: QuoteParams): Promise<InsuranceQuote | null>;
  activatePolicy(quoteProviderId: string | undefined, shipmentId: string): Promise<PolicyResult | null>;
}
