import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { canAccessShipment } from "@/lib/shipments/access";

const SAFE_PATH_REGEX = /^[a-f0-9-]{36}\/[a-zA-Z0-9._-]+$/;

function isValidStoragePath(value: string): boolean {
  if (value.length < 3 || value.length > 500) return false;
  if (value.includes("..") || value.startsWith("/")) return false;
  // Normalize percent-encoded sequences and re-check
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.includes("..") || decoded.startsWith("/")) return false;
  } catch {
    return false;
  }
  return SAFE_PATH_REGEX.test(value);
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get("bucket")?.trim() ?? "";
  const path = searchParams.get("path")?.trim() ?? "";
  const shipmentId = searchParams.get("shipmentId")?.trim() ?? null;

  if (!bucket || !path) {
    return NextResponse.json({ error: "bucket y path requeridos" }, { status: 400 });
  }
  if (!isValidStoragePath(path)) {
    return NextResponse.json({ error: "path inválido" }, { status: 400 });
  }

  if (bucket === "shipment-evidence") {
    if (!shipmentId) {
      return NextResponse.json({ error: "shipmentId requerido" }, { status: 400 });
    }
    const access = await canAccessShipment(supabase, shipmentId, user.id);
    if (!access.allowed) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    if (!path.startsWith(`${shipmentId}/`)) {
      return NextResponse.json({ error: "path fuera del envío" }, { status: 403 });
    }
  } else if (bucket === "dni-documents") {
    if (!path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: "path fuera del usuario" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "bucket no permitido" }, { status: 400 });
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 5);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? "No se pudo generar URL firmada" }, { status: 500 });
  }
  return NextResponse.json({ signedUrl: data.signedUrl });
}
