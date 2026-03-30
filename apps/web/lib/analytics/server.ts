import { posthogAnalyticsAdapter } from "./adapters/posthog";
import type { AnalyticsAdapter } from "./types";

const adapters: Record<string, AnalyticsAdapter> = {
  posthog: posthogAnalyticsAdapter,
};

function getAnalyticsAdapter(): AnalyticsAdapter {
  const provider = process.env.ANALYTICS_PROVIDER?.trim().toLowerCase() || "posthog";
  return adapters[provider] ?? posthogAnalyticsAdapter;
}

export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const adapter = getAnalyticsAdapter();
  if (!adapter.isConfigured()) return;
  await adapter.trackEvent(distinctId, event, properties);
}
