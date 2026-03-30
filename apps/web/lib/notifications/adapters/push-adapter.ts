import type { NotificationAdapter, NotifyParams } from "../types";

export const pushNotificationAdapter: NotificationAdapter = {
  channel: "push",

  isConfigured(): boolean {
    return Boolean(process.env.PUSH_SEND_SECRET ?? process.env.ASSIGNMENT_RUN_SECRET);
  },

  async send(params: NotifyParams) {
    if (!params.push) return { sent: false };
    const pushSecret = process.env.PUSH_SEND_SECRET ?? process.env.ASSIGNMENT_RUN_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    if (!pushSecret) return { sent: false, error: "push not configured" };

    try {
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
      return {
        sent: res.ok,
        recipient: params.userId,
        error: res.ok ? undefined : "push failed",
      };
    } catch {
      return { sent: false, recipient: params.userId, error: "push failed" };
    }
  },
};
