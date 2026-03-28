import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { canAccessShipment } from "@/lib/shipments/access";

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["at_origin", "cancelled"],
  at_origin: ["loading", "cancelled"],
  loading: ["in_transit", "cancelled"],
  in_transit: ["arriving", "delivered"],
  arriving: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id: shipmentId } = await context.params;
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const access = await canAccessShipment(supabase, shipmentId, user.id);
  if (!access.allowed) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  let body: { status?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const nextStatus = typeof body.status === "string" ? body.status : "";
  if (!nextStatus) {
    return NextResponse.json({ error: "status requerido" }, { status: 400 });
  }

  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .select("id,status,client_id")
    .eq("id", shipmentId)
    .maybeSingle();
  if (shipmentError || !shipment) {
    return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });
  }

  const currentStatus = (shipment as { status?: string | null }).status ?? "pending";
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (!allowedNext.includes(nextStatus)) {
    return NextResponse.json(
      { error: `Transición inválida: ${currentStatus} -> ${nextStatus}` },
      { status: 400 }
    );
  }

  if (nextStatus === "cancelled") {
    if ((shipment as { client_id?: string | null }).client_id !== user.id) {
      return NextResponse.json({ error: "Solo el cliente puede cancelar" }, { status: 403 });
    }
  } else if (!access.driverUserId || access.driverUserId !== user.id) {
    return NextResponse.json(
      { error: "Solo el fletero asignado puede avanzar estados operativos" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("shipments")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", shipmentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, status: nextStatus });
}
