import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createShipmentSchema } from "@/lib/schemas";
import { COMMISSION } from "@shared/types";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const role = searchParams.get("role") || "client";
  const view = searchParams.get("view");

  let query = supabase
    .from("shipments")
    .select("*, shipment_legs(*), payments(*)")
    .order("created_at", { ascending: false });

  if (role === "driver") {
    const { data: driverRow, error: driverLookupError } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (driverLookupError) {
      return NextResponse.json({ error: driverLookupError.message }, { status: 500 });
    }
    if (!driverRow) {
      return NextResponse.json({ shipments: [] });
    }
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
  const rate = enforceRateLimit({
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

  // Calculate pricing
  let totalBase = 0;
  const legsWithPricing = input.legs.map((leg, i) => {
    const distKm = calculateDistance(leg.originLat, leg.originLng, leg.destLat, leg.destLng);
    const basePrice = Math.round(3200 + distKm * 1800);
    const chainDiscount = i === 0 ? 0 : Math.min(0.15 + (i - 1) * 0.12, 0.45);
    const legPrice = Math.round(basePrice * (1 - chainDiscount));
    totalBase += basePrice;
    return { ...leg, legOrder: i, distanceKm: distKm, estimatedMinutes: Math.round(distKm * 3.5), price: legPrice, discount: chainDiscount * 100 };
  });

  const totalFinal = legsWithPricing.reduce((s, l) => s + l.price, 0);
  const commission = Math.round(totalFinal * COMMISSION.BASE_RATE);

  // Create shipment
  const { data: shipment, error: shipError } = await supabase
    .from("shipments")
    .insert({
      client_id: user.id,
      type: input.type,
      description: input.description,
      weight: input.weight,
      helpers: input.helpers,
      scheduled_at: input.scheduledAt || new Date().toISOString(),
      base_price: totalBase,
      discount: Math.round(((totalBase - totalFinal) / totalBase) * 100),
      final_price: totalFinal,
      commission,
      status: "pending",
    })
    .select()
    .single();

  if (shipError) return NextResponse.json({ error: shipError.message }, { status: 500 });

  // Create legs
  const { error: legsError } = await supabase
    .from("shipment_legs")
    .insert(
      legsWithPricing.map((leg) => ({
        shipment_id: shipment.id,
        leg_order: leg.legOrder,
        origin_address: leg.originAddress,
        origin_location: `POINT(${leg.originLng} ${leg.originLat})`,
        dest_address: leg.destAddress,
        dest_location: `POINT(${leg.destLng} ${leg.destLat})`,
        distance_km: leg.distanceKm,
        estimated_minutes: leg.estimatedMinutes,
        price: leg.price,
        discount: leg.discount,
      }))
    );

  if (legsError) return NextResponse.json({ error: legsError.message }, { status: 500 });

  return NextResponse.json({ shipment, legs: legsWithPricing }, { status: 201 });
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
}
