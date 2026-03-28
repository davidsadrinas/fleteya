import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { canAccessShipment } from "@/lib/shipments/access";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id: shipmentId } = await context.params;
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const access = await canAccessShipment(supabase, shipmentId, user.id);
  if (!access.allowed) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data, error } = await supabase
    .from("shipment_disputes")
    .select(
      "id, shipment_id, reported_by, reason, description, evidence_urls, status, resolution_note, resolved_at, created_at"
    )
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ disputes: data ?? [] });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { id: shipmentId } = await context.params;
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ip = getRequesterIp(req.headers);
  const rate = await enforceRateLimit({
    key: `dispute:${shipmentId}:${user.id}:${ip}`,
    max: 6,
    windowMs: 15 * 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Rate limit excedido" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const access = await canAccessShipment(supabase, shipmentId, user.id);
  if (!access.allowed) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  let body: { reason?: unknown; description?: unknown; evidenceUrls?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : null;
  const evidenceUrls = Array.isArray(body.evidenceUrls)
    ? body.evidenceUrls
        .filter((x): x is string => typeof x === "string")
        .map((url) => url.trim())
        .filter((url) => {
          try {
            const parsed = new URL(url);
            return parsed.protocol === "http:" || parsed.protocol === "https:";
          } catch {
            return false;
          }
        })
        .slice(0, 10)
    : [];

  if (!reason) return NextResponse.json({ error: "Razón requerida" }, { status: 400 });
  if (reason.length > 120) {
    return NextResponse.json({ error: "Razón demasiado larga" }, { status: 400 });
  }
  if (description && description.length > 1000) {
    return NextResponse.json({ error: "Descripción demasiado larga" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("shipment_disputes")
    .insert({
      shipment_id: shipmentId,
      reported_by: user.id,
      reason,
      description,
      evidence_urls: evidenceUrls,
    })
    .select(
      "id, shipment_id, reported_by, reason, description, evidence_urls, status, resolution_note, resolved_at, created_at"
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ dispute: data }, { status: 201 });
}
