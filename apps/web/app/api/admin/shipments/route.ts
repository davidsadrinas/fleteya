import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { error, status } = await requireAdmin(supabase);
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(req.url);
  const filterStatus = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createServiceRoleSupabase();
  let query = admin
    .from("shipments")
    .select("*, shipment_legs(*), payments(*), profiles!shipments_client_id_fkey(name, email)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filterStatus) query = query.eq("status", filterStatus);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data: shipments, error: dbError, count } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ shipments: shipments ?? [], total: count ?? 0, page, limit });
}
