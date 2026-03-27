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
    .from("shipment_chat_messages")
    .select("id, shipment_id, sender_user_id, body, quick_tag, created_at")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { id: shipmentId } = await context.params;
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ip = getRequesterIp(req.headers);
  const rate = enforceRateLimit({
    key: `chat:${shipmentId}:${user.id}:${ip}`,
    max: 20,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Rate limit excedido" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
          "X-RateLimit-Remaining": String(rate.remaining),
        },
      }
    );
  }

  const access = await canAccessShipment(supabase, shipmentId, user.id);
  if (!access.allowed) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  let body: { body?: string; quickTag?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const text = body.body?.trim() ?? "";
  if (!text) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  if (text.length > 1000) {
    return NextResponse.json({ error: "Mensaje demasiado largo" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("shipment_chat_messages")
    .insert({
      shipment_id: shipmentId,
      sender_user_id: user.id,
      body: text,
      quick_tag: body.quickTag?.trim() || null,
    })
    .select("id, shipment_id, sender_user_id, body, quick_tag, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data }, { status: 201 });
}
