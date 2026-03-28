import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { z } from "zod";

const resolveSchema = z.object({
  status: z.enum(["under_review", "resolved", "rejected"]),
  resolution_note: z.string().max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { error, status, user } = await requireAdmin(supabase);
  if (error || !user) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { status: newStatus, resolution_note } = parsed.data;
  const disputeId = params.id;

  const admin = createServiceRoleSupabase();

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === "resolved" || newStatus === "rejected") {
    updateData.resolved_at = new Date().toISOString();
    updateData.resolution_note = resolution_note ?? null;
  }

  const { data: dispute, error: updateError } = await admin
    .from("shipment_disputes")
    .update(updateData)
    .eq("id", disputeId)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await admin.from("admin_actions").insert({
    admin_user_id: user.id,
    action: "dispute_resolve",
    target_type: "dispute",
    target_id: disputeId,
    details: { status: newStatus, resolution_note: resolution_note ?? null },
  });

  return NextResponse.json({ ok: true, dispute });
}
