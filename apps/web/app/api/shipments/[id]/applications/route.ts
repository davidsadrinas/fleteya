import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  runShipmentAssignment,
  type RunAssignmentSuccess,
} from "@/lib/shipments/run-assignment";

type RouteContext = { params: Promise<{ id: string }> };

/** List applications visible to the caller (RLS). */
export async function GET(_req: NextRequest, context: RouteContext) {
  const { id: shipmentId } = await context.params;
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("shipment_driver_applications")
    .select(
      "id, shipment_id, driver_id, status, applied_at, driver_lat, driver_lng, drivers(rating,total_trips,verified)"
    )
    .eq("shipment_id", shipmentId)
    .order("applied_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applications: data ?? [] });
}

/** Driver posts application to an open pending shipment. */
export async function POST(req: NextRequest, context: RouteContext) {
  const { id: shipmentId } = await context.params;
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: { driverLat?: number; driverLng?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { data: driverRow, error: driverError } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (driverError) {
    return NextResponse.json({ error: driverError.message }, { status: 500 });
  }
  if (!driverRow) {
    return NextResponse.json(
      { error: "Solo fleteros registrados pueden postularse" },
      { status: 403 }
    );
  }

  const { error } = await supabase.from("shipment_driver_applications").insert({
    shipment_id: shipmentId,
    driver_id: driverRow.id,
    driver_lat: body.driverLat ?? null,
    driver_lng: body.driverLng ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya te postulaste a este envío" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let assignment: RunAssignmentSuccess | null = null;
  if (process.env.AUTO_ASSIGN_ON_APPLICATION === "true") {
    try {
      const outcome = await runShipmentAssignment({ shipmentId });
      if (outcome.ok) {
        assignment = outcome.data;
      }
    } catch {
      // Missing SERVICE_ROLE_KEY or RPC: postulation still valid; cliente sigue "esperando asignación"
    }
  }

  return NextResponse.json({ ok: true, assignment }, { status: 201 });
}
