import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { z } from "zod";

const verifySchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { error, status, user } = await requireAdmin(supabase);
  if (error || !user) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { action, reason } = parsed.data;
  const driverId = params.id;

  const admin = createServiceRoleSupabase();

  const updateData =
    action === "approve"
      ? { verified: true, updated_at: new Date().toISOString() }
      : { verified: false, dni_verified: false, updated_at: new Date().toISOString() };

  const { data: driver, error: updateError } = await admin
    .from("drivers")
    .update(updateData)
    .eq("id", driverId)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log admin action
  await admin.from("admin_actions").insert({
    admin_user_id: user.id,
    action: "driver_verify",
    target_type: "driver",
    target_id: driverId,
    details: { action, reason: reason ?? null },
  });

  return NextResponse.json({ ok: true, driver });
}
