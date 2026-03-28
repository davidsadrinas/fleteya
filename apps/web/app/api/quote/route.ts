import { NextRequest, NextResponse } from "next/server";
import { createAnonSupabase } from "@/lib/supabase/admin";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";
import { COMMISSION } from "@shared/types";
import { calcChainDiscount, calcDistanceKm } from "@shared/utils";
import { z } from "zod";

const quoteLegSchema = z.object({
  originAddress: z.string().min(3),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destAddress: z.string().min(3),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
});

const quoteSchema = z.object({
  legs: z.array(quoteLegSchema).min(1).max(5),
  shipmentType: z.string().optional(),
  vehicleType: z.string().optional(),
});

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

  let totalBase = 0;
  const legsWithPricing = input.legs.map((leg, i) => {
    const distKm = calcDistanceKm(
      leg.originLat,
      leg.originLng,
      leg.destLat,
      leg.destLng
    );
    const basePrice = Math.round(3200 + distKm * 1800);
    const chainDiscount = calcChainDiscount(i, input.legs.length);
    const legPrice = Math.round(basePrice * (1 - chainDiscount));
    totalBase += basePrice;
    return {
      originAddress: leg.originAddress,
      destAddress: leg.destAddress,
      distanceKm: distKm,
      price: legPrice,
      discount: Math.round(chainDiscount * 100),
    };
  });

  const totalFinal = legsWithPricing.reduce((s, l) => s + l.price, 0);
  const commission = Math.round(totalFinal * COMMISSION.BASE_RATE);
  const savings = totalBase - totalFinal;

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
  });
}
