import { reportError } from "@/lib/error-reporting";
import type { OcrResult } from "./types";
import { parseDni } from "./parsers/dni";
import { parseLicense } from "./parsers/license";
import { parseInsurance } from "./parsers/insurance";

let visionClient: any = null;
let visionLoaded = false;

async function getVisionClient() {
  if (visionLoaded) return visionClient;
  visionLoaded = true;

  const credentialsJson = process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
  if (!credentialsJson) {
    console.warn("[OCR] GOOGLE_CLOUD_CREDENTIALS_JSON not set, OCR disabled");
    return null;
  }

  try {
    const { ImageAnnotatorClient } = await import("@google-cloud/vision");
    const credentials = JSON.parse(
      Buffer.from(credentialsJson, "base64").toString("utf-8")
    );
    visionClient = new ImageAnnotatorClient({ credentials });
    return visionClient;
  } catch (err) {
    await reportError(err, { tags: { service: "ocr" } });
    return null;
  }
}

const PARSERS: Record<string, (text: string) => Record<string, string | null>> = {
  dni_front: parseDni,
  dni_back: parseDni,
  license: parseLicense,
  insurance: parseInsurance,
};

export type DocumentType = "dni_front" | "dni_back" | "license" | "insurance" | "vtv";

export async function extractDocument(
  imageUrl: string,
  documentType: DocumentType
): Promise<OcrResult> {
  const client = await getVisionClient();

  if (!client) {
    return {
      success: false,
      rawText: "",
      confidence: 0,
      fields: {},
      error: "OCR no configurado",
    };
  }

  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return { success: false, rawText: "", confidence: 0, fields: {}, error: "No se pudo descargar la imagen" };
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const [result] = await client.textDetection({ image: { content: imageBuffer } });

    const fullText: string = result.textAnnotations?.[0]?.description ?? "";
    const confidence: number = (result.textAnnotations?.[0]?.confidence ?? 0.5) * 100;

    const parser = PARSERS[documentType];
    const fields = parser ? parser(fullText) : {};

    return { success: true, rawText: fullText, confidence, fields };
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
  return !!process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
}
