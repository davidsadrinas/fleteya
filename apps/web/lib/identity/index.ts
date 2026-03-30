import { renaperAdapter } from "./adapters/renaper";
import { nosisProvider } from "./providers/nosis";
import type {
  IdentityVerificationAdapter,
  IdentityVerificationRequest,
  IdentityVerificationResult,
} from "./types";

const providers: Record<string, IdentityVerificationAdapter> = {
  renaper: renaperAdapter,
  nosis: nosisProvider,
};

function resolveProviderName(): string {
  const raw = process.env.RENAPER_PROVIDER?.trim().toLowerCase() ?? "";
  if (raw === "nosis") return "renaper";
  if (!raw) return "renaper";
  return raw;
}

function getProvider(): IdentityVerificationAdapter | null {
  const name = resolveProviderName();
  return providers[name] ?? null;
}

export function getIdentityVerificationAdapter(): IdentityVerificationAdapter | null {
  return getProvider();
}

export function getIdentityProviderName(): string {
  const provider = getProvider();
  return provider?.name ?? resolveProviderName();
}

export async function verifyIdentity(
  request: IdentityVerificationRequest
): Promise<IdentityVerificationResult> {
  const provider = getProvider();

  if (!provider) {
    console.warn("[Identity] No provider configured, skipping verification");
    return {
      status: "error",
      confidence: 0,
      rejectionReason: "No hay proveedor de verificacion configurado",
      rawResponse: {},
      matchDetails: { nameMatch: false, numberMatch: false, documentExpired: false },
    };
  }

  return provider.verify(request);
}

export function isIdentityConfigured(): boolean {
  const provider = getProvider();
  return Boolean(provider?.isConfigured());
}

export type {
  IdentityVerificationRequest,
  IdentityVerificationResult,
} from "./types";
