import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET() {
  const supabase = createServerSupabase();
  const { error, status } = await requireAdmin(supabase);
  if (error) return NextResponse.json({ error }, { status });

  const admin = createServiceRoleSupabase();
  const { data, error: rpcError } = await admin.rpc("admin_platform_stats");

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  return NextResponse.json({ stats: data });
}
