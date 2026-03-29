import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";
import { quoteInsurance } from "@/lib/insurance";
import { z } from "zod";

const quoteSchema = z.object({
  declaredValue: z.number().positive().max(50_000_000),
  shipmentType: z.string().min(1),
  distanceKm: z.number().positive(),
  coverageType: z.enum(["basic", "full", "fragile"]).default("basic"),
});

export async function POST(req: NextRequest) {
  const ip = getRequesterIp(req.headers);
  const rate = await enforceRateLimit({
    key: `insurance:quote:${ip}`,
    max: 30,
    windowMs: 15 * 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = quoteSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: body.error.flatten() },
      { status: 400 }
    );
  }

  const quote = await quoteInsurance(body.data);

  return NextResponse.json(quote);
}
