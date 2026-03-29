"use client";

type PostHogLike = {
  capture(event: string, properties?: Record<string, unknown>): void;
  identify(distinctId: string, properties?: Record<string, unknown>): void;
  reset(): void;
};

let posthogInstance: PostHogLike | null = null;
let posthogLoaded = false;

export async function getPostHog(): Promise<PostHogLike | null> {
  if (typeof window === "undefined") return null;
  if (posthogLoaded) return posthogInstance;
  posthogLoaded = true;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  try {
    const posthog = (await import("posthog-js")).default;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false, // manual pageviews via AnalyticsProvider
      capture_pageleave: true,
      autocapture: true,
      persistence: "localStorage",
    });
    posthogInstance = posthog;
    return posthog;
  } catch {
    return null;
  }
}

export async function trackEvent(
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const posthog = await getPostHog();
  posthog?.capture(event, properties);
}

export async function identifyUser(
  userId: string,
  traits?: Record<string, unknown>
): Promise<void> {
  const posthog = await getPostHog();
  posthog?.identify(userId, traits);
}

export async function resetAnalytics(): Promise<void> {
  const posthog = await getPostHog();
  posthog?.reset();
}
