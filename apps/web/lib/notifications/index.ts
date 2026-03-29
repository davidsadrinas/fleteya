import { sendEmail, isEmailConfigured } from "@/lib/email";
import { sendSms, isSmsConfigured } from "@/lib/sms";
import { sendWhatsAppTemplate, isWhatsAppConfigured } from "@/lib/whatsapp";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";

type NotificationChannel = "email" | "sms" | "whatsapp" | "push";

interface NotifyParams {
  userId: string;
  eventType: string;
  // Email
  email?: { to: string; subject: string; html: string };
  // WhatsApp
  whatsapp?: { to: string; templateName: string; parameters?: string[] };
  // SMS
  sms?: { to: string; body: string };
  // Push (uses existing /api/push/send)
  push?: { title: string; body: string; url?: string };
}

interface NotifyResult {
  channels: NotificationChannel[];
  errors: string[];
}

export async function notifyUser(params: NotifyParams): Promise<NotifyResult> {
  const channels: NotificationChannel[] = [];
  const errors: string[] = [];

  let adminSupabase: ReturnType<typeof createServiceRoleSupabase> | null = null;
  function getAdmin() {
    if (!adminSupabase) adminSupabase = createServiceRoleSupabase();
    return adminSupabase;
  }

  async function log(channel: NotificationChannel, recipient: string, status: "sent" | "failed" | "skipped", error?: string) {
    try {
      await getAdmin().from("notification_log").insert({
        user_id: params.userId,
        channel,
        event_type: params.eventType,
        recipient,
        status,
        error,
      });
    } catch {
      // best-effort logging
    }
  }

  // 1. Push notification
  if (params.push) {
    try {
      const pushSecret = process.env.PUSH_SEND_SECRET ?? process.env.ASSIGNMENT_RUN_SECRET;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      if (pushSecret) {
        const res = await fetch(`${appUrl}/api/push/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pushSecret}`,
          },
          body: JSON.stringify({
            userId: params.userId,
            title: params.push.title,
            body: params.push.body,
            url: params.push.url,
          }),
        });
        if (res.ok) {
          channels.push("push");
          await log("push", params.userId, "sent");
        }
      }
    } catch {
      // push is best-effort
    }
  }

  // 2. WhatsApp
  if (params.whatsapp && isWhatsAppConfigured()) {
    const sent = await sendWhatsAppTemplate({
      to: params.whatsapp.to.replace(/\D/g, ""),
      templateName: params.whatsapp.templateName,
      parameters: params.whatsapp.parameters,
    });
    if (sent) {
      channels.push("whatsapp");
      await log("whatsapp", params.whatsapp.to, "sent");
    } else {
      errors.push("whatsapp failed");
      await log("whatsapp", params.whatsapp.to, "failed");
    }
  }

  // 3. Email
  if (params.email && isEmailConfigured()) {
    const sent = await sendEmail(params.email);
    if (sent) {
      channels.push("email");
      await log("email", params.email.to, "sent");
    } else {
      errors.push("email failed");
      await log("email", params.email.to, "failed");
    }
  }

  // 4. SMS as last resort — only if no other channel succeeded
  if (params.sms && isSmsConfigured() && channels.length === 0) {
    const sent = await sendSms(params.sms);
    if (sent) {
      channels.push("sms");
      await log("sms", params.sms.to, "sent");
    } else {
      errors.push("sms failed");
      await log("sms", params.sms.to, "failed");
    }
  }

  return { channels, errors };
}
