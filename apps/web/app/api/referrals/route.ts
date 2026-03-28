import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { REFERRAL_REWARD_AMOUNT, REFERRAL_MAX_USES, REFERRAL_CODE_LENGTH } from "@shared/constants";
import { z } from "zod";

function generateCode(name: string): string {
  const prefix = (name || "FYA")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH - prefix.length; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return prefix + suffix;
}

export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Get or create referral code
  let { data: code } = await supabase
    .from("referral_codes")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!code) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    const newCode = generateCode(profile?.name ?? "");

    const { data: created, error: createErr } = await supabase
      .from("referral_codes")
      .insert({
        user_id: user.id,
        code: newCode,
        max_uses: REFERRAL_MAX_USES,
        reward_amount: REFERRAL_REWARD_AMOUNT,
      })
      .select("*")
      .single();

    if (createErr) {
      return NextResponse.json({ error: "No se pudo crear código" }, { status: 500 });
    }
    code = created;
  }

  // Get redemptions
  const { data: redemptions } = await supabase
    .from("referral_redemptions")
    .select("*, profiles!referral_redemptions_referred_user_id_fkey(name)")
    .eq("referrer_user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ code, redemptions: redemptions ?? [] });
}

const redeemSchema = z.object({
  code: z.string().min(3).max(20),
});

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const admin = createServiceRoleSupabase();

  // Check if user was already referred
  const { data: existing } = await admin
    .from("referral_redemptions")
    .select("id")
    .eq("referred_user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Ya usaste un código de referido" }, { status: 409 });
  }

  // Find code
  const { data: codeRow } = await admin
    .from("referral_codes")
    .select("*")
    .eq("code", parsed.data.code.toUpperCase())
    .eq("active", true)
    .maybeSingle();

  if (!codeRow) {
    return NextResponse.json({ error: "Código no encontrado o inactivo" }, { status: 404 });
  }

  if (codeRow.user_id === user.id) {
    return NextResponse.json({ error: "No podés usar tu propio código" }, { status: 400 });
  }

  if (codeRow.uses >= codeRow.max_uses) {
    return NextResponse.json({ error: "Código agotado" }, { status: 409 });
  }

  // Create redemption
  const { error: redeemErr } = await admin.from("referral_redemptions").insert({
    code_id: codeRow.id,
    referred_user_id: user.id,
    referrer_user_id: codeRow.user_id,
    referrer_reward: codeRow.reward_amount,
    referred_reward: codeRow.reward_amount,
  });

  if (redeemErr) {
    return NextResponse.json({ error: "No se pudo aplicar el código" }, { status: 500 });
  }

  // Increment uses
  await admin
    .from("referral_codes")
    .update({ uses: codeRow.uses + 1 })
    .eq("id", codeRow.id);

  return NextResponse.json({
    ok: true,
    reward: codeRow.reward_amount,
    message: `Código aplicado. Ganás $${codeRow.reward_amount} en tu primer envío.`,
  });
}
