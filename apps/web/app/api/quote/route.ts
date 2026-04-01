import { NextRequest, NextResponse } from "next/server";
import { createAnonSupabase } from "@/lib/supabase/admin";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";
import { quoteSchema } from "@/lib/schemas";
import { calculateShipmentPricing } from "@/lib/pricing";
import { COMMISSION } from "@shared/types";

export async function POST(req: NextRequest) {
  const ip = getRequesterIp(req.headers);
  const rate = await enforceRateLimit({
    key: `quote:${ip}`,
    max: 30,
    windowMs: 15 * 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json();
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const pricingResult = await calculateShipmentPricing({
    legs: input.legs,
    pricing: input.pricing,
    includePolyline: true,
  });
  const legsWithPricing = pricingResult.legs;
  const totalBase = pricingResult.basePrice;
  const totalFinal = pricingResult.finalPrice;
  const commission = Math.round(totalFinal * COMMISSION.BASE_RATE);
  const savings = pricingResult.savings;

  // Store quote session
  const supabase = createAnonSupabase();
  const { data: session } = await supabase
    .from("quote_sessions")
    .insert({
      legs: legsWithPricing,
      shipment_type: input.shipmentType ?? null,
      vehicle_type: input.vehicleType ?? null,
      base_price: totalBase,
      final_price: totalFinal,
      commission,
    })
    .select("id, session_token")
    .single();

  return NextResponse.json({
    quoteId: session?.id ?? null,
    sessionToken: session?.session_token ?? null,
    legs: legsWithPricing,
    basePrice: totalBase,
    finalPrice: totalFinal,
    commission,
    savings,
    pricing: pricingResult.appliedPricing,
  });
}
