import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { trackingPointSchema } from "@/lib/schemas";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";
import { canAccessShipment } from "@/lib/shipments/access";

// POST: Driver sends GPS position
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ip = getRequesterIp(req.headers);
  const rate = await enforceRateLimit({
    key: `tracking:post:${user.id}:${ip}`,
    max: 240,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Rate limit excedido" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json();
  const parsed = trackingPointSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { shipmentId, lat, lng, speed, heading } = parsed.data;

  const access = await canAccessShipment(supabase, shipmentId, user.id);
  if (!access.allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (!access.driverUserId || access.driverUserId !== user.id) {
    return NextResponse.json({ error: "Solo el fletero asignado puede compartir ubicación" }, { status: 403 });
  }

  const { error } = await supabase.from("tracking_points").insert({
    shipment_id: shipmentId,
    location: `POINT(${lng} ${lat})`,
    speed,
    heading,
  });

  if (error) return NextResponse.json({ error: "No se pudo guardar el tracking" }, { status: 500 });

  return NextResponse.json({ success: true });
}

// GET: Client fetches latest position
export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const shipmentId = searchParams.get("shipmentId");
  if (!shipmentId) return NextResponse.json({ error: "shipmentId requerido" }, { status: 400 });

  const access = await canAccessShipment(supabase, shipmentId, user.id);
  if (!access.allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("tracking_points")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return NextResponse.json({ error: "No hay tracking disponible" }, { status: 404 });

  return NextResponse.json({ point: data });
}
