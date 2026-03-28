import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { error, status } = await requireAdmin(supabase);
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(req.url);
  const filterStatus = searchParams.get("status") ?? "all";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createServiceRoleSupabase();
  let query = admin
    .from("shipment_disputes")
    .select("*, profiles!shipment_disputes_reported_by_fkey(name, email)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filterStatus !== "all") {
    query = query.eq("status", filterStatus);
  }

  const { data: disputes, error: dbError, count } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ disputes: disputes ?? [], total: count ?? 0, page, limit });
}
