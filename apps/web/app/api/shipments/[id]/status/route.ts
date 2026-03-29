import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { canAccessShipment } from "@/lib/shipments/access";
import { notifyUser } from "@/lib/notifications";
import { shipmentDeliveredEmail } from "@/lib/email/templates";
import { trackServerEvent } from "@/lib/analytics/server";

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

  // --- Notify client on delivery ---
  if (nextStatus === "delivered") {
    const admin = createServiceRoleSupabase();
    const { data: fullShipment } = await admin
      .from("shipments")
      .select("client_id, driver_id, final_price")
      .eq("id", shipmentId)
      .maybeSingle();
    if (fullShipment) {
      const { data: clientProfile } = await admin
        .from("profiles")
        .select("name, email, phone")
        .eq("id", fullShipment.client_id)
        .maybeSingle();
      let driverName = "Tu fletero";
      if (fullShipment.driver_id) {
        const { data: driverRow } = await admin
          .from("drivers")
          .select("user_id")
          .eq("id", fullShipment.driver_id)
          .maybeSingle();
        if (driverRow) {
          const { data: dp } = await admin
            .from("profiles")
            .select("name")
            .eq("id", driverRow.user_id)
            .maybeSingle();
          if (dp?.name) driverName = dp.name;
        }
      }
      if (clientProfile) {
        const emailData = shipmentDeliveredEmail({
          clientName: clientProfile.name || "Cliente",
          shipmentId,
          driverName,
          finalPrice: fullShipment.final_price ?? 0,
        });
        void notifyUser({
          userId: fullShipment.client_id,
          eventType: "shipment_delivered",
          email: clientProfile.email ? { to: clientProfile.email, ...emailData } : undefined,
          whatsapp: clientProfile.phone
            ? { to: clientProfile.phone, templateName: "shipment_delivered", parameters: [shipmentId.slice(0, 8), String(fullShipment.final_price ?? 0)] }
            : undefined,
          push: { title: "Envío entregado", body: `Tu envío #${shipmentId.slice(0, 8)} fue entregado por ${driverName}`, url: `/tracking?id=${shipmentId}` },
        });
      }
      void trackServerEvent(fullShipment.client_id, "shipment_delivered", { shipmentId });
    }
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}
