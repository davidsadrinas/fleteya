import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";
import { MercadoPagoConfig, Preference } from "mercadopago";
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

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Configuración de pagos incompleta" },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const mpConfig = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(mpConfig);

  const finalPrice = Number(shipment.final_price);
  const commission = Number(shipment.commission);
  const driverPayout = finalPrice - commission;

  try {
    const result = await preference.create({
      body: {
        items: [
          {
            id: shipmentId,
            title: `Flete #${shipmentId.slice(0, 8)}`,
            quantity: 1,
            unit_price: finalPrice,
            currency_id: "ARS",
          },
        ],
        back_urls: {
          success: `${appUrl}/shipment/confirmation?id=${shipmentId}`,
          failure: `${appUrl}/shipment?error=payment`,
          pending: `${appUrl}/shipment?pending=true`,
        },
        notification_url: `${appUrl}/api/payments/webhook`,
        external_reference: shipmentId,
        auto_return: "approved",
      },
    });

    // Insert payment record using service role
    const admin = createServiceRoleSupabase();
    await admin.from("payments").insert({
      shipment_id: shipmentId,
      amount: finalPrice,
      commission,
      driver_payout: driverPayout,
      status: "pending",
      mercadopago_preference_id: result.id,
    });

    return NextResponse.json(
      { preferenceId: result.id, initPoint: result.init_point },
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
