import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createShipmentSchema } from "@/lib/schemas";
import { calculateShipmentPricing } from "@/lib/pricing";
import { COMMISSION } from "@shared/types";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const view = searchParams.get("view");

  let query = supabase
    .from("shipments")
    .select("*, shipment_legs(*), payments(*)")
    .order("created_at", { ascending: false });

  const { data: driverRow, error: driverLookupError } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (driverLookupError) {
    return NextResponse.json({ error: driverLookupError.message }, { status: 500 });
  }

  if (driverRow?.id) {
    if (view === "open") {
      query = query.is("driver_id", null).eq("status", "pending");
    } else {
      query = query.eq("driver_id", driverRow.id);
    }
  } else {
    query = query.eq("client_id", user.id);
  }

  if (status) query = query.eq("status", status);

  const { data, error } = await query.limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ shipments: data });
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ip = getRequesterIp(req.headers);
  const rate = await enforceRateLimit({
    key: `shipments:create:${user.id}:${ip}`,
    max: 15,
    windowMs: 15 * 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Rate limit excedido" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json();
  const parsed = createShipmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;

  const pricingResult = await calculateShipmentPricing({
    legs: input.legs,
    pricing: input.pricing,
    includePolyline: false,
  });
  const legsWithPricing = pricingResult.legs;
  const totalBase = pricingResult.basePrice;

  const totalFinal = pricingResult.finalPrice;
  const commission = Math.round(totalFinal * COMMISSION.BASE_RATE);

  const rpcLegs = legsWithPricing.map((leg) => ({
    leg_order: leg.legOrder,
    origin_address: leg.originAddress,
    origin_lat: leg.originLat,
    origin_lng: leg.originLng,
    dest_address: leg.destAddress,
    dest_lat: leg.destLat,
    dest_lng: leg.destLng,
    distance_km: leg.distanceKm,
    estimated_minutes: leg.estimatedMinutes,
    price: leg.price,
    discount: leg.discount,
  }));

  const { data: createdShipmentId, error: rpcError } = await supabase.rpc(
    "create_shipment_with_legs",
    {
      p_client_id: user.id,
      p_type: input.type,
      p_description: input.description ?? null,
      p_weight: input.weight ?? null,
      p_helpers: input.helpers,
      p_scheduled_at: input.scheduledAt || new Date().toISOString(),
      p_base_price: totalBase,
      p_discount: Math.round(((totalBase - totalFinal) / totalBase) * 100),
      p_final_price: totalFinal,
      p_commission: commission,
      p_legs: rpcLegs,
    }
  );
  if (rpcError || !createdShipmentId) {
    return NextResponse.json({ error: rpcError?.message ?? "No se pudo crear el envío" }, { status: 500 });
  }

  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .select("*")
    .eq("id", createdShipmentId)
    .single();
  if (shipmentError) {
    return NextResponse.json({ error: shipmentError.message }, { status: 500 });
  }

  return NextResponse.json({ shipment, legs: legsWithPricing }, { status: 201 });
}
