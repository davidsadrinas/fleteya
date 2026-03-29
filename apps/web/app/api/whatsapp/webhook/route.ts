import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Meta sends GET to validate the webhook endpoint
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Incoming messages from WhatsApp users
export async function POST(req: NextRequest) {
  const ip = getRequesterIp(req.headers);
  const rate = await enforceRateLimit({
    key: `whatsapp:webhook:${ip}`,
    max: 200,
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

  const entry = (body.entry as any[])?.[0];
  const changes = entry?.changes?.[0];
  const messages = changes?.value?.messages as any[] | undefined;

  if (messages) {
    for (const message of messages) {
      const from: string = message.from;
      const text: string | undefined = message.text?.body;

      // Log incoming messages for now — future: lookup user, auto-respond with shipment status
      console.log(`[WhatsApp] Incoming from ${from}: ${text ?? "(non-text)"}`);
    }
  }

  // Always acknowledge to Meta
  return NextResponse.json({ ok: true });
}
