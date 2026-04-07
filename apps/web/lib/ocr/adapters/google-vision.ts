import { reportError } from "@/lib/error-reporting";
import type { OcrAdapter } from "../types";

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
    const credentials = JSON.parse(Buffer.from(credentialsJson, "base64").toString("utf-8"));
    visionClient = new ImageAnnotatorClient({ credentials });
    return visionClient;
  } catch (err) {
    await reportError(err, { tags: { service: "ocr", provider: "google-vision" } });
    return null;
  }
}

export const googleVisionAdapter: OcrAdapter = {
  isConfigured() {
    return !!process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
  },

  async extractText(imageUrl: string): Promise<{ rawText: string; confidence: number } | null> {
    const client = await getVisionClient();
    if (!client) return null;

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) return null;
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const [result] = await client.textDetection({ image: { content: imageBuffer } });
    const rawText: string = result.textAnnotations?.[0]?.description ?? "";
    const confidence: number = (result.textAnnotations?.[0]?.confidence ?? 0.5) * 100;
    return { rawText, confidence };
  },
};
