import type { ErrorReportingAdapter } from "../types";

type SentryModule = {
  isInitialized: () => boolean;
  init: (input: Record<string, unknown>) => void;
  captureException: (err: unknown, ctx?: Record<string, unknown>) => void;
};

let sentryModule: SentryModule | null = null;
let sentryLoaded = false;

async function loadSentry(): Promise<SentryModule | null> {
  if (sentryLoaded) return sentryModule;
  sentryLoaded = true;
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return null;
  try {
    const mod = (await import("@sentry/nextjs")) as unknown as SentryModule;
    if (!mod.isInitialized()) {
      mod.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
      });
    }
    sentryModule = mod;
    return mod;
  } catch {
    return null;
  }
}

export const sentryErrorReportingAdapter: ErrorReportingAdapter = {
  name: "sentry",

  isConfigured(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
  },

  async report(error, context): Promise<void> {
    const sentry = await loadSentry();
    if (!sentry) return;
    sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
    } as Record<string, unknown>);
  },
};
