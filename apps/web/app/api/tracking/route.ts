import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { trackingPointSchema } from "@/lib/schemas";

// POST: Driver sends GPS position
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = trackingPointSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { shipmentId, lat, lng, speed, heading } = parsed.data;

  // Verify driver is assigned to this shipment
  const { data: shipment } = await supabase
    .from("shipments")
    .select("driver_id")
    .eq("id", shipmentId)
    .single();

  if (!shipment) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });

  const { error } = await supabase.from("tracking_points").insert({
    shipment_id: shipmentId,
    location: `POINT(${lng} ${lat})`,
    speed,
    heading,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// GET: Client fetches latest position
export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { searchParams } = new URL(req.url);
  const shipmentId = searchParams.get("shipmentId");
  if (!shipmentId) return NextResponse.json({ error: "shipmentId requerido" }, { status: 400 });

  const { data, error } = await supabase
    .from("tracking_points")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ point: data });
}
