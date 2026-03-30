import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";
import { getPaymentAdapter } from "@/lib/payments";
import { createPaymentPreferenceUseCase } from "@/lib/use-cases/payments/create-payment-preference";
import { z } from "zod";

const paymentSchema = z.object({ shipmentId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ip = getRequesterIp(req.headers);
  const rate = await enforceRateLimit({
    key: `payments:create:${user.id}:${ip}`,
    max: 10,
    windowMs: 15 * 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Rate limit excedido" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { shipmentId } = parsed.data;

  const { data: shipment, error: shipErr } = await supabase
    .from("shipments")
    .select("id, client_id, final_price, commission, status")
    .eq("id", shipmentId)
    .single();

  if (shipErr || !shipment) {
    return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });
  }
  if (shipment.client_id !== user.id) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  if (!["pending", "accepted"].includes(shipment.status)) {
    return NextResponse.json(
      { error: "El envío no está en estado válido para pagar" },
      { status: 409 }
    );
  }

  // Check no existing approved payment
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, status")
    .eq("shipment_id", shipmentId)
    .eq("status", "approved")
    .maybeSingle();

  if (existingPayment) {
    return NextResponse.json({ error: "Ya existe un pago aprobado" }, { status: 409 });
  }

  const paymentAdapter = getPaymentAdapter();
  if (!paymentAdapter.isConfigured()) {
    return NextResponse.json(
      { error: "Configuración de pagos incompleta" },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const finalPrice = Number(shipment.final_price);
  const commission = Number(shipment.commission);

  try {
    const admin = createServiceRoleSupabase();
    const result = await createPaymentPreferenceUseCase(
      {
        paymentAdapter,
        persistPendingPayment: async (payment) => {
          await admin.from("payments").insert({
            shipment_id: payment.shipmentId,
            amount: payment.amount,
            commission: payment.commission,
            driver_payout: payment.driverPayout,
            status: "pending",
            mercadopago_preference_id: payment.preferenceId,
          });
        },
      },
      {
      shipmentId,
      finalPrice,
        commission,
      appUrl,
      }
    );

    return NextResponse.json(
      { preferenceId: result.preferenceId, initPoint: result.initPoint },
      { status: 201 }
    );
  } catch (err) {
    console.error("MercadoPago preference error:", err);
    return NextResponse.json(
      { error: "No se pudo crear la preferencia de pago" },
      { status: 500 }
    );
  }
}
