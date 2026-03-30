import { isSmsConfigured, sendSms } from "@/lib/sms";
import type { NotificationAdapter, NotifyParams } from "../types";

export const smsNotificationAdapter: NotificationAdapter = {
  channel: "sms",

  isConfigured(): boolean {
    return isSmsConfigured();
  },

  async send(params: NotifyParams) {
    if (!params.sms) return { sent: false };
    const sent = await sendSms(params.sms);
    return {
      sent,
      recipient: params.sms.to,
      error: sent ? undefined : "sms failed",
    };
  },
};
