import type {
  IdentityVerificationAdapter,
  IdentityVerificationRequest,
  IdentityVerificationResult,
} from "../types";

const CONFIDENCE_THRESHOLD = 75;

function errorResult(reason: string): IdentityVerificationResult {
  return {
    status: "error",
    confidence: 0,
    rejectionReason: reason,
    rawResponse: {},
    matchDetails: { nameMatch: false, numberMatch: false, documentExpired: false },
  };
}

export const renaperAdapter: IdentityVerificationAdapter = {
  name: "renaper",

  isConfigured(): boolean {
    return Boolean(process.env.RENAPER_API_URL && process.env.RENAPER_API_KEY);
  },

  async verify(
    request: IdentityVerificationRequest
  ): Promise<IdentityVerificationResult> {
    const apiUrl = process.env.RENAPER_API_URL;
    const apiKey = process.env.RENAPER_API_KEY;
    const apiSecret = process.env.RENAPER_API_SECRET;

    if (!apiUrl || !apiKey) {
      return errorResult("Proveedor RENAPER no configurado");
    }

    const response = await fetch(`${apiUrl}/identity/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(apiSecret ? { "X-Api-Secret": apiSecret } : {}),
      },
      body: JSON.stringify({
        document_type: request.documentType === "dni" ? "DNI" : "LIC",
        document_number: request.documentNumber,
        full_name: request.fullName,
        birth_date: request.birthDate,
        gender: request.gender,
        front_image_url: request.frontImageUrl,
        back_image_url: request.backImageUrl,
        selfie_url: request.selfieUrl,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        status: "error",
        confidence: 0,
        rejectionReason: `API error: ${response.status}`,
        rawResponse: { error: errorBody, status: response.status },
        matchDetails: { nameMatch: false, numberMatch: false, documentExpired: false },
      };
    }

    const data = (await response.json()) as Record<string, unknown>;
    const confidence =
      typeof data.confidence_score === "number" ? data.confidence_score : 0;

    return {
      status: confidence >= CONFIDENCE_THRESHOLD ? "verified" : "rejected",
      confidence,
      rejectionReason:
        confidence < CONFIDENCE_THRESHOLD
          ? `Confianza insuficiente: ${confidence}% (minimo ${CONFIDENCE_THRESHOLD}%)`
          : undefined,
      rawResponse: data,
      matchDetails: {
        nameMatch: Boolean(data.name_match),
        numberMatch: Boolean(data.document_match),
        faceMatch:
          typeof data.face_match === "boolean"
            ? data.face_match
            : undefined,
        documentExpired: Boolean(data.document_expired),
      },
    };
  },
};
