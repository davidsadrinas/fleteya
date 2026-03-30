import { isWhatsAppConfigured, sendWhatsAppTemplate } from "@/lib/whatsapp";
import type { NotificationAdapter, NotifyParams } from "../types";

export const whatsappNotificationAdapter: NotificationAdapter = {
  channel: "whatsapp",

  isConfigured(): boolean {
    return isWhatsAppConfigured();
  },

  async send(params: NotifyParams) {
    if (!params.whatsapp) return { sent: false };
    const to = params.whatsapp.to.replace(/\D/g, "");
    const sent = await sendWhatsAppTemplate({
      to,
      templateName: params.whatsapp.templateName,
      parameters: params.whatsapp.parameters,
    });
    return {
      sent,
      recipient: params.whatsapp.to,
      error: sent ? undefined : "whatsapp failed",
    };
  },
};
