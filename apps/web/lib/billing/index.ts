import { afipBillingAdapter } from "./adapters/afip";
import type { BillingAdapter, InvoiceParams, InvoiceResult } from "./types";

const adapters: Record<string, BillingAdapter> = {
  afip: afipBillingAdapter,
};

export function getBillingAdapter(): BillingAdapter {
  const provider = process.env.BILLING_PROVIDER?.trim().toLowerCase() || "afip";
  return adapters[provider] ?? afipBillingAdapter;
}

export async function emitInvoice(params: InvoiceParams): Promise<InvoiceResult> {
  return getBillingAdapter().emitInvoice(params);
}

export function isBillingConfigured(): boolean {
  return getBillingAdapter().isConfigured();
}

export type { BillingAdapter, InvoiceParams, InvoiceResult } from "./types";
