import { isEmailConfigured, sendEmail } from "@/lib/email";
import type { NotificationAdapter, NotifyParams } from "../types";

export const emailNotificationAdapter: NotificationAdapter = {
  channel: "email",

  isConfigured(): boolean {
    return isEmailConfigured();
  },

  async send(params: NotifyParams) {
    if (!params.email) return { sent: false };
    const sent = await sendEmail(params.email);
    return {
      sent,
      recipient: params.email.to,
      error: sent ? undefined : "email failed",
    };
  },
};
