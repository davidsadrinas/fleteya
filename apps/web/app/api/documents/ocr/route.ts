import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";
import { extractDocument, isOcrConfigured } from "@/lib/ocr";
import type { DocumentType } from "@/lib/ocr";
import { z } from "zod";

const ocrSchema = z.object({
  imageUrl: z.string().url(),
  documentType: z.enum(["dni_front", "dni_back", "license", "insurance", "vtv"]),
});

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ip = getRequesterIp(req.headers);
  const rate = await enforceRateLimit({
    key: `ocr:${user.id}:${ip}`,
    max: 20,
    windowMs: 15 * 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Rate limit excedido" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  if (!isOcrConfigured()) {
    return NextResponse.json({ error: "OCR no disponible" }, { status: 503 });
  }

  const body = ocrSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: body.error.flatten() },
      { status: 400 }
    );
  }

  const result = await extractDocument(
    body.data.imageUrl,
    body.data.documentType as DocumentType
  );

  return NextResponse.json(result, { status: result.success ? 200 : 422 });
}
