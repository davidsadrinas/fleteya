import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { canAccessShipment } from "@/lib/shipments/access";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

type EvidenceStage = "pickup" | "delivery";

function parseStage(value: unknown): EvidenceStage | null {
  return value === "pickup" || value === "delivery" ? value : null;
}

function isValidEvidenceReference(value: string): boolean {
  if (value.includes("..") || value.startsWith("/")) return false;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }
  return value.length > 3;
}

function isExpectedShipmentPath(value: string, shipmentId: string): boolean {
  if (value.startsWith("http://") || value.startsWith("https://")) return true;
  return value.startsWith(`${shipmentId}/`);
}

function extractPathFromReference(value: string): string {
  if (!(value.startsWith("http://") || value.startsWith("https://"))) return value;
  try {
    const parsed = new URL(value);
    const marker = "/shipment-evidence/";
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return value;
    return decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    return value;
  }
}

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
    .from("shipment_evidence")
    .select("id, shipment_id, uploaded_by, stage, file_url, note, created_at")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ evidence: data ?? [] });
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
    key: `evidence:${shipmentId}:${user.id}:${ip}`,
    max: 30,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Rate limit excedido" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const access = await canAccessShipment(supabase, shipmentId, user.id);
  if (!access.allowed) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  let body: { stage?: unknown; fileUrl?: unknown; note?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const stage = parseStage(body.stage);
  const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() : null;

  if (!stage) return NextResponse.json({ error: "Etapa inválida" }, { status: 400 });
  if (!fileUrl) return NextResponse.json({ error: "fileUrl requerido" }, { status: 400 });
  if (!isValidEvidenceReference(fileUrl)) {
    return NextResponse.json({ error: "fileUrl inválido" }, { status: 400 });
  }
  const normalizedPath = extractPathFromReference(fileUrl);
  if (!isExpectedShipmentPath(normalizedPath, shipmentId)) {
    return NextResponse.json({ error: "Evidencia fuera del envío" }, { status: 400 });
  }
  if (note && note.length > 500) {
    return NextResponse.json({ error: "Nota demasiado larga" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("shipment_evidence")
    .insert({
      shipment_id: shipmentId,
      uploaded_by: user.id,
      stage,
      file_url: normalizedPath,
      note,
    })
    .select("id, shipment_id, uploaded_by, stage, file_url, note, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ evidence: data }, { status: 201 });
}
