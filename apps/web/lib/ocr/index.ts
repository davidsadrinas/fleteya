import type { OcrResult } from "./types";
import { parseDni } from "./parsers/dni";
import { parseLicense } from "./parsers/license";
import { parseInsurance } from "./parsers/insurance";
import { reportError } from "@/lib/error-reporting";
import { googleVisionAdapter } from "./adapters/google-vision";
import type { DocumentType, OcrAdapter } from "./types";

const PARSERS: Record<string, (text: string) => Record<string, string | null>> = {
  dni_front: parseDni,
  dni_back: parseDni,
  license: parseLicense,
  insurance: parseInsurance,
};

function getOcrAdapter(): OcrAdapter {
  const provider = (process.env.OCR_PROVIDER ?? "google-vision").toLowerCase();
  if (provider === "google-vision") return googleVisionAdapter;
  return googleVisionAdapter;
}

export async function extractDocument(
  imageUrl: string,
  documentType: DocumentType
): Promise<OcrResult> {
  const adapter = getOcrAdapter();
  const extraction = await adapter.extractText(imageUrl);
  if (!extraction) {
    return {
      success: false,
      rawText: "",
      confidence: 0,
      fields: {},
      error: "OCR no configurado",
    };
  }

  try {
    const parser = PARSERS[documentType];
    const fields = parser ? parser(extraction.rawText) : {};

    return { success: true, rawText: extraction.rawText, confidence: extraction.confidence, fields };
  } catch (err) {
    await reportError(err, { tags: { service: "ocr", documentType } });
    return {
      success: false,
      rawText: "",
      confidence: 0,
      fields: {},
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export function isOcrConfigured(): boolean {
  return getOcrAdapter().isConfigured();
}

export type { DocumentType };
