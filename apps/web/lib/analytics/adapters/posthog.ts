import type { AnalyticsAdapter } from "../types";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export const posthogAnalyticsAdapter: AnalyticsAdapter = {
  name: "posthog",

  isConfigured(): boolean {
    return Boolean(POSTHOG_KEY);
  },

  async trackEvent(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>
  ): Promise<void> {
    if (!POSTHOG_KEY) return;
    try {
      await fetch(`${POSTHOG_HOST}/capture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: POSTHOG_KEY,
          event,
          distinct_id: distinctId,
          properties: { ...properties, $lib: "fletaya-server" },
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // best effort
    }
  },
};
