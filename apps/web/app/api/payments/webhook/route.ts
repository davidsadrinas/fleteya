import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";
import { MercadoPagoConfig, Payment as MPPayment } from "mercadopago";
import { createHmac } from "crypto";
import { PAYMENT_RELEASE_HOURS } from "@shared/constants";

function verifyWebhookSignature(
  req: NextRequest,
  body: Record<string, unknown>
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("MERCADOPAGO_WEBHOOK_SECRET not set — skipping signature check");
    return true;
  }

  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";

  const parts: Record<string, string> = {};
  for (const part of xSignature.split(",")) {
    const [key, value] = part.split("=").map((s) => s.trim());
    if (key && value) parts[key] = value;
  }

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const dataId = String((body.data as Record<string, unknown>)?.id ?? "");
  const manifest = `id=${dataId};request-id=${xRequestId};ts=${ts};`;
  const computed = createHmac("sha256", secret).update(manifest).digest("hex");

  return computed === v1;
}

const MP_STATUS_MAP: Record<string, string> = {
  approved: "approved",
  rejected: "rejected",
  in_process: "pending",
  pending: "pending",
  refunded: "refunded",
  charged_back: "refunded",
  cancelled: "rejected",
};

export async function POST(req: NextRequest) {
  const ip = getRequesterIp(req.headers);
  const rate = await enforceRateLimit({
    key: `payments:webhook:${ip}`,
    max: 100,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (!verifyWebhookSignature(req, body)) {
    console.error("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const type = body.type as string | undefined;
  const action = body.action as string | undefined;
  const dataId = (body.data as Record<string, unknown>)?.id;

  if (!type || !action || !dataId) {
    return NextResponse.json({ ok: true });
  }

  if (type !== "payment" || !action.includes("payment")) {
    return NextResponse.json({ ok: true });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("MERCADOPAGO_ACCESS_TOKEN not set");
    return NextResponse.json({ ok: true });
  }

  try {
    const mpConfig = new MercadoPagoConfig({ accessToken });
    const mpPayment = new MPPayment(mpConfig);
    const paymentInfo = await mpPayment.get({ id: Number(dataId) });

    const externalRef = paymentInfo.external_reference;
    if (!externalRef) {
      return NextResponse.json({ ok: true });
    }

    const admin = createServiceRoleSupabase();
    const mappedStatus = MP_STATUS_MAP[paymentInfo.status ?? ""] ?? "pending";

    const updateData: Record<string, unknown> = {
      mercadopago_id: String(paymentInfo.id),
      status: mappedStatus,
      mercadopago_payment_type: paymentInfo.payment_type_id ?? null,
      webhook_verified: true,
      mercadopago_data: paymentInfo,
      updated_at: new Date().toISOString(),
    };

    if (mappedStatus === "approved") {
      const releaseAt = new Date(
        Date.now() + PAYMENT_RELEASE_HOURS * 60 * 60 * 1000
      ).toISOString();
      updateData.payout_status = "scheduled";
      updateData.payout_scheduled_at = releaseAt;
    }

    await admin
      .from("payments")
      .update(updateData)
      .eq("shipment_id", externalRef)
      .eq("status", "pending");

    // If payment approved, accept shipment if still pending
    if (mappedStatus === "approved") {
      await admin
        .from("shipments")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", externalRef)
        .eq("status", "pending");
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
  }

  return NextResponse.json({ ok: true });
}
