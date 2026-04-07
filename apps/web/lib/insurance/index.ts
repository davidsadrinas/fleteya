import { cargoInsuranceHttpAdapter } from "./adapters/cargo-insurance-http";
import { internalInsuranceAdapter } from "./adapters/internal";
import type { InsuranceAdapter, InsuranceQuote, PolicyResult, QuoteParams } from "./types";

function getInsuranceAdapter(): InsuranceAdapter {
  const provider = (process.env.CARGO_INSURANCE_PROVIDER ?? "internal").toLowerCase();
  if (provider === "cargo_http") return cargoInsuranceHttpAdapter;
  return internalInsuranceAdapter;
}

export async function quoteInsurance(params: QuoteParams): Promise<InsuranceQuote> {
  const selected = getInsuranceAdapter();
  const quote = await selected.quote(params);
  if (quote) return quote;
  const fallbackQuote = await internalInsuranceAdapter.quote(params);
  if (fallbackQuote) return fallbackQuote;
  throw new Error("No se pudo cotizar el seguro");
}

export async function activatePolicy(
  quoteProviderId: string | undefined,
  shipmentId: string
): Promise<PolicyResult> {
  const selected = getInsuranceAdapter();
  const result = await selected.activatePolicy(quoteProviderId, shipmentId);
  if (result) return result;
  const fallbackResult = await internalInsuranceAdapter.activatePolicy(quoteProviderId, shipmentId);
  if (fallbackResult) return fallbackResult;
  throw new Error("No se pudo activar la póliza");
}

export function isInsuranceConfigured(): boolean {
  return getInsuranceAdapter().isConfigured();
}

export type { QuoteParams, InsuranceQuote, PolicyResult } from "./types";
