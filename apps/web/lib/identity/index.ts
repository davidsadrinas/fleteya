import { nosisProvider } from "./providers/nosis";
import type { IdentityProvider, VerificationRequest, VerificationResult } from "./types";

const providers: Record<string, IdentityProvider> = {
  nosis: nosisProvider,
};

function getProvider(): IdentityProvider | null {
  const name = process.env.RENAPER_PROVIDER ?? "nosis";
  return providers[name] ?? null;
}

export async function verifyIdentity(
  request: VerificationRequest
): Promise<VerificationResult> {
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
  return !!process.env.RENAPER_API_KEY;
}

export type { VerificationRequest, VerificationResult } from "./types";
