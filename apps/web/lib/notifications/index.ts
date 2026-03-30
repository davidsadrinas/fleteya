import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { emailNotificationAdapter } from "./adapters/email-adapter";
import { pushNotificationAdapter } from "./adapters/push-adapter";
import { smsNotificationAdapter } from "./adapters/sms-adapter";
import { whatsappNotificationAdapter } from "./adapters/whatsapp-adapter";
import type { NotificationAdapter, NotificationChannel, NotifyParams, NotifyResult } from "./types";

const adapters: NotificationAdapter[] = [
  pushNotificationAdapter,
  whatsappNotificationAdapter,
  emailNotificationAdapter,
  smsNotificationAdapter,
];

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

  for (const adapter of adapters) {
    if (!adapter.isConfigured()) continue;
    if (adapter.channel === "sms" && channels.length > 0) continue; // last-resort fallback

    const result = await adapter.send(params);
    if (!result.recipient) continue;
    if (result.sent) {
      channels.push(adapter.channel);
      await log(adapter.channel, result.recipient, "sent");
    } else {
      const message = result.error ?? `${adapter.channel} failed`;
      errors.push(message);
      await log(adapter.channel, result.recipient, "failed", message);
    }
  }

  return { channels, errors };
}

export type { NotifyParams, NotifyResult, NotificationChannel } from "./types";
