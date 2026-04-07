import type { InsuranceAdapter, InsuranceQuote, PolicyResult, QuoteParams } from "../types";

const RATES: Record<string, number> = {
  basic: 0.015,
  full: 0.03,
  fragile: 0.05,
};

const MIN_PREMIUM = 500;

function buildQuote(params: QuoteParams): InsuranceQuote {
  const rate = RATES[params.coverageType] ?? RATES.basic;
  const premium = Math.max(params.declaredValue * rate, MIN_PREMIUM);
  return {
    premium: Math.round(premium * 100) / 100,
    deductible: Math.round(premium * 0.1 * 100) / 100,
    coverageDetails: `Cobertura ${params.coverageType} — hasta $${params.declaredValue.toLocaleString("es-AR")}`,
  };
}

export const internalInsuranceAdapter: InsuranceAdapter = {
  isConfigured() {
    return true;
  },
  async quote(params: QuoteParams): Promise<InsuranceQuote> {
    return buildQuote(params);
  },
  async activatePolicy(): Promise<PolicyResult> {
    return { success: true, policyNumber: `FY-${Date.now()}` };
  },
};
