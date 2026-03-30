import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";
import {
  verifyIdentity,
  isIdentityConfigured,
  getIdentityProviderName,
} from "@/lib/identity";
import { notifyUser } from "@/lib/notifications";
import { driverApprovedEmail } from "@/lib/email/templates";
import { verifyDriverUseCase } from "@/lib/use-cases/drivers/verify-driver";
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

  const { data: driverProfile } = await admin
    .from("profiles")
    .select("id, name, email, phone")
    .eq("id", driver.user_id)
    .maybeSingle();
  const verificationExecution = await verifyDriverUseCase(
    {
      verifyIdentity: async ({ dniNumber, fullName, docs }) =>
        verifyIdentity({
          documentType: "dni",
          documentNumber: dniNumber,
          fullName,
          frontImageUrl: docs.dniFrontUrl ?? "",
          backImageUrl: docs.dniBackUrl ?? "",
          selfieUrl: docs.selfieUrl ?? "",
        }),
      getIdentityProviderName,
      saveIdentityVerification: async (payload) => {
        await admin.from("identity_verifications").insert({
          driver_id: payload.driverId,
          provider: payload.provider,
          document_type: "dni",
          document_number: payload.dniNumber,
          status: payload.verification.status,
          confidence: payload.verification.confidence,
          raw_response: payload.verification.rawResponse,
          rejection_reason: payload.verification.rejectionReason,
          verified_at:
            payload.verification.status === "verified"
              ? new Date().toISOString()
              : null,
        });
      },
      logAdminAction: async (payload) => {
        await admin.from("admin_actions").insert({
          admin_user_id: payload.adminUserId,
          action: "driver_verify",
          target_type: "driver",
          target_id: payload.driverId,
          details: { action: payload.action, reason: payload.reason ?? null },
        });
      },
      notifyDriverStatus: async ({ profile, action: statusAction, reason: statusReason }) => {
        const emailData = driverApprovedEmail({
          driverName: profile.name || "Fletero",
          approved: statusAction === "approve",
          reason: statusReason,
        });
        await notifyUser({
          userId: profile.id,
          eventType: statusAction === "approve" ? "driver_approved" : "driver_rejected",
          email: profile.email ? { to: profile.email, ...emailData } : undefined,
          whatsapp:
            profile.phone && statusAction === "approve"
              ? {
                  to: profile.phone,
                  templateName: "driver_approved",
                  parameters: [profile.name || "Fletero"],
                }
              : undefined,
          push: {
            title: emailData.subject,
            body:
              statusAction === "approve"
                ? "Tu cuenta fue aprobada!"
                : `Verificación rechazada${statusReason ? `: ${statusReason}` : ""}`,
          },
        });
      },
    },
    {
      adminUserId: user.id,
      driverId,
      action,
      reason,
      dniNumber: parsed.data.dniNumber,
      fullName: parsed.data.fullName,
      docs: {
        dniFrontUrl: driver.dni_front_url ?? null,
        dniBackUrl: driver.dni_back_url ?? null,
        selfieUrl: driver.selfie_url ?? null,
      },
      profile: driverProfile
        ? {
            id: driverProfile.id as string,
            name: (driverProfile.name as string | null) ?? null,
            email: (driverProfile.email as string | null) ?? null,
            phone: (driverProfile.phone as string | null) ?? null,
          }
        : null,
      isIdentityConfigured: isIdentityConfigured(),
    }
  );
  if (verificationExecution.identityRejected) {
    return NextResponse.json(
      {
        error: "Verificación de identidad fallida",
        reason: verificationExecution.rejectionReason,
        confidence: verificationExecution.confidence,
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ ok: true, driver });
}
