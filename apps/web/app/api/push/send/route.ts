import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { z } from "zod";

const sendSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  url: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Require internal bearer token
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const secret = process.env.PUSH_SEND_SECRET ?? process.env.ASSIGNMENT_RUN_SECRET;
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { userId, title, body: notifBody, url } = parsed.data;
  const admin = createServiceRoleSupabase();

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .eq("user_id", userId)
    .eq("active", true);

  if (!subscriptions?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured — push notifications disabled");
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const payload = JSON.stringify({
    title,
    body: notifBody,
    url: url ?? "/dashboard",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
  });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      // Web Push protocol: send payload to the push service endpoint
      // In production, use the web-push library. This is a simplified version.
      const response = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          TTL: "86400",
        },
        body: payload,
      });
      if (response.ok || response.status === 201) {
        sent++;
      } else if (response.status === 410) {
        // Subscription expired, deactivate
        await admin
          .from("push_subscriptions")
          .update({ active: false })
          .eq("endpoint", sub.endpoint)
          .eq("user_id", userId);
      }
    } catch {
      // Skip failed sends
    }
  }

  return NextResponse.json({ ok: true, sent });
}
