import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { verifyIdentity, isIdentityConfigured } from "@/lib/identity";
import { notifyUser } from "@/lib/notifications";
import { driverApprovedEmail } from "@/lib/email/templates";
import { z } from "zod";

const verifySchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
  dniNumber: z.string().min(7).max(8).optional(),
  fullName: z.string().optional(),
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

  // --- RENAPER: auto-verify identity if configured ---
  if (action === "approve" && isIdentityConfigured() && parsed.data.dniNumber) {
    const verificationResult = await verifyIdentity({
      documentType: "dni",
      documentNumber: parsed.data.dniNumber,
      fullName: parsed.data.fullName ?? "",
      frontImageUrl: driver.dni_front_url ?? "",
      backImageUrl: driver.dni_back_url ?? "",
      selfieUrl: driver.selfie_url ?? "",
    });

    await admin.from("identity_verifications").insert({
      driver_id: driverId,
      provider: process.env.RENAPER_PROVIDER ?? "nosis",
      document_type: "dni",
      document_number: parsed.data.dniNumber,
      status: verificationResult.status,
      confidence: verificationResult.confidence,
      raw_response: verificationResult.rawResponse,
      rejection_reason: verificationResult.rejectionReason,
      verified_at: verificationResult.status === "verified" ? new Date().toISOString() : null,
    });

    if (verificationResult.status === "rejected") {
      return NextResponse.json({
        error: "Verificación de identidad fallida",
        reason: verificationResult.rejectionReason,
        confidence: verificationResult.confidence,
      }, { status: 422 });
    }
  }

  // Log admin action
  await admin.from("admin_actions").insert({
    admin_user_id: user.id,
    action: "driver_verify",
    target_type: "driver",
    target_id: driverId,
    details: { action, reason: reason ?? null },
  });

  // --- Notify driver via email/whatsapp ---
  const { data: driverProfile } = await admin
    .from("profiles")
    .select("id, name, email, phone")
    .eq("id", driver.user_id)
    .maybeSingle();
  if (driverProfile) {
    const emailData = driverApprovedEmail({
      driverName: driverProfile.name || "Fletero",
      approved: action === "approve",
      reason,
    });
    void notifyUser({
      userId: driverProfile.id,
      eventType: action === "approve" ? "driver_approved" : "driver_rejected",
      email: driverProfile.email ? { to: driverProfile.email, ...emailData } : undefined,
      whatsapp: driverProfile.phone && action === "approve"
        ? { to: driverProfile.phone, templateName: "driver_approved", parameters: [driverProfile.name || "Fletero"] }
        : undefined,
      push: { title: emailData.subject, body: action === "approve" ? "Tu cuenta fue aprobada!" : `Verificación rechazada${reason ? `: ${reason}` : ""}` },
    });
  }

  return NextResponse.json({ ok: true, driver });
}
