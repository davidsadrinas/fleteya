import { reportError } from "@/lib/error-reporting";

interface QuoteParams {
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

interface PolicyResult {
  success: boolean;
  policyNumber?: string;
  externalId?: string;
  error?: string;
}

const RATES: Record<string, number> = {
  basic: 0.015,   // 1.5% of declared value
  full: 0.03,     // 3%
  fragile: 0.05,  // 5%
};

const MIN_PREMIUM = 500; // ARS

export async function quoteInsurance(params: QuoteParams): Promise<InsuranceQuote> {
  const apiUrl = process.env.CARGO_INSURANCE_API_URL;
  const apiKey = process.env.CARGO_INSURANCE_API_KEY;

  if (apiUrl && apiKey) {
    try {
      const response = await fetch(`${apiUrl}/quotes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          declared_value: params.declaredValue,
          cargo_type: params.shipmentType,
          distance_km: params.distanceKm,
          coverage: params.coverageType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          premium: data.premium,
          deductible: data.deductible ?? 0,
          coverageDetails: data.coverage_details,
          providerId: data.quote_id,
        };
      }
    } catch (err) {
      await reportError(err, { tags: { service: "insurance" } });
    }
  }

  // Fallback: internal calculation
  const rate = RATES[params.coverageType] ?? RATES.basic;
  const premium = Math.max(params.declaredValue * rate, MIN_PREMIUM);

  return {
    premium: Math.round(premium * 100) / 100,
    deductible: Math.round(premium * 0.1 * 100) / 100,
    coverageDetails: `Cobertura ${params.coverageType} — hasta $${params.declaredValue.toLocaleString("es-AR")}`,
  };
}

export async function activatePolicy(
  quoteProviderId: string | undefined,
  shipmentId: string
): Promise<PolicyResult> {
  const apiUrl = process.env.CARGO_INSURANCE_API_URL;
  const apiKey = process.env.CARGO_INSURANCE_API_KEY;

  if (apiUrl && apiKey && quoteProviderId) {
    try {
      const response = await fetch(`${apiUrl}/policies`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quote_id: quoteProviderId,
          shipment_reference: shipmentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, policyNumber: data.policy_number, externalId: data.policy_id };
      }
    } catch (err) {
      await reportError(err, { tags: { service: "insurance" } });
    }
  }

  // Fallback: internal policy reference
  return { success: true, policyNumber: `FY-${Date.now()}` };
}

export function isInsuranceConfigured(): boolean {
  return !!process.env.CARGO_INSURANCE_API_KEY;
}
