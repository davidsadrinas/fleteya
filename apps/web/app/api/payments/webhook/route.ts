import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";
import { getPaymentAdapter } from "@/lib/payments";
import { createHmac } from "crypto";
import { emitInvoice, isBillingConfigured } from "@/lib/billing";
import { notifyUser } from "@/lib/notifications";
import { shipmentConfirmedEmail, paymentReceiptEmail } from "@/lib/email/templates";
import { trackServerEvent } from "@/lib/analytics/server";
import { handlePaymentWebhookUseCase } from "@/lib/use-cases/payments/handle-payment-webhook";

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

  const paymentAdapter = getPaymentAdapter();
  if (!paymentAdapter.isConfigured()) {
    console.error("Payment adapter not configured");
    return NextResponse.json({ ok: true });
  }

  try {
    const paymentInfo = await paymentAdapter.getPaymentById(Number(dataId));
    const externalRef = paymentInfo.externalReference;
    if (!externalRef) {
      return NextResponse.json({ ok: true });
    }

    const admin = createServiceRoleSupabase();
    await handlePaymentWebhookUseCase(
      {
        updatePendingPayment: async (shipmentId, updateData) => {
          await admin
            .from("payments")
            .update(updateData)
            .eq("shipment_id", shipmentId)
            .eq("status", "pending");
        },
        acceptShipmentIfPending: async (shipmentId) => {
          await admin
            .from("shipments")
            .update({ status: "accepted", updated_at: new Date().toISOString() })
            .eq("id", shipmentId)
            .eq("status", "pending");
        },
        emitInvoiceForPayment: async ({ paymentId, shipmentId, amount }) => {
          if (!isBillingConfigured()) return {};
          const invoice = await emitInvoice({ paymentId, shipmentId, amount });
          if (!invoice.success) return {};
          await admin.from("invoices").insert({
            payment_id: shipmentId,
            shipment_id: shipmentId,
            invoice_type: "factura_c",
            status: "issued",
            punto_venta: 1,
            numero_comprobante: invoice.numeroComprobante,
            cae: invoice.cae,
            cae_vencimiento: invoice.caeVencimiento,
            total: amount,
            neto: amount,
          });
          return { cae: invoice.cae };
        },
        findShipmentSummary: async (shipmentId) => {
          const { data } = await admin
            .from("shipments")
            .select("client_id, final_price")
            .eq("id", shipmentId)
            .maybeSingle();
          if (!data) return null;
          return {
            clientId: data.client_id as string,
            finalPrice: Number(data.final_price ?? 0),
          };
        },
        findClientProfile: async (clientId) => {
          const { data } = await admin
            .from("profiles")
            .select("name, email, phone")
            .eq("id", clientId)
            .maybeSingle();
          if (!data) return null;
          return {
            name: (data.name as string | null) ?? null,
            email: (data.email as string | null) ?? null,
            phone: (data.phone as string | null) ?? null,
          };
        },
        notifyShipmentConfirmed: async ({
          clientId,
          shipmentId,
          finalPrice,
          profile,
          paymentAmount,
          cae,
        }) => {
          const confirmed = shipmentConfirmedEmail({
            clientName: profile.name || "Cliente",
            shipmentId,
            finalPrice,
          });
          const receipt = paymentReceiptEmail({
            clientName: profile.name || "Cliente",
            shipmentId,
            amount: paymentAmount,
            cae,
          });
          await notifyUser({
            userId: clientId,
            eventType: "shipment_confirmed",
            email: profile.email ? { to: profile.email, ...confirmed } : undefined,
            whatsapp: profile.phone
              ? {
                  to: profile.phone,
                  templateName: "shipment_confirmed",
                  parameters: [
                    profile.name || "Cliente",
                    shipmentId.slice(0, 8),
                    String(finalPrice),
                  ],
                }
              : undefined,
            push: {
              title: confirmed.subject,
              body: `Pago recibido por $${finalPrice.toLocaleString("es-AR")}`,
            },
          });
          if (profile.email) {
            await notifyUser({
              userId: clientId,
              eventType: "payment_receipt",
              email: { to: profile.email, ...receipt },
            });
          }
        },
        trackPaymentCompleted: async ({
          clientId,
          shipmentId,
          amount,
          paymentTypeId,
        }) => {
          await trackServerEvent(clientId, "payment_completed", {
            amount,
            paymentType: paymentTypeId,
            shipmentId,
          });
        },
      },
      {
        shipmentId: externalRef,
        payment: paymentInfo,
      }
    );
  } catch (err) {
    console.error("Webhook processing error:", err);
  }

  return NextResponse.json({ ok: true });
}
