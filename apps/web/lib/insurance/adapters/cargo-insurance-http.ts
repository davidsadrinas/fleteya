import { reportError } from "@/lib/error-reporting";
import type { InsuranceAdapter, InsuranceQuote, PolicyResult, QuoteParams } from "../types";

export const cargoInsuranceHttpAdapter: InsuranceAdapter = {
  isConfigured() {
    return !!process.env.CARGO_INSURANCE_API_KEY && !!process.env.CARGO_INSURANCE_API_URL;
  },

  async quote(params: QuoteParams): Promise<InsuranceQuote | null> {
    const apiUrl = process.env.CARGO_INSURANCE_API_URL;
    const apiKey = process.env.CARGO_INSURANCE_API_KEY;
    if (!apiUrl || !apiKey) return null;

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

      if (!response.ok) return null;
      const data = await response.json();
      return {
        premium: data.premium,
        deductible: data.deductible ?? 0,
        coverageDetails: data.coverage_details,
        providerId: data.quote_id,
      };
    } catch (err) {
      await reportError(err, { tags: { service: "insurance", provider: "cargo-http" } });
      return null;
    }
  },

  async activatePolicy(quoteProviderId: string | undefined, shipmentId: string): Promise<PolicyResult | null> {
    const apiUrl = process.env.CARGO_INSURANCE_API_URL;
    const apiKey = process.env.CARGO_INSURANCE_API_KEY;
    if (!apiUrl || !apiKey || !quoteProviderId) return null;

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
      if (!response.ok) return null;
      const data = await response.json();
      return { success: true, policyNumber: data.policy_number, externalId: data.policy_id };
    } catch (err) {
      await reportError(err, { tags: { service: "insurance", provider: "cargo-http" } });
      return null;
    }
  },
};
