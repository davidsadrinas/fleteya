/**
 * Centralized error reporting.
 * When NEXT_PUBLIC_SENTRY_DSN is set, errors are sent to Sentry.
 * Otherwise, they are logged to console (dev mode).
 *
 * To enable Sentry:
 *   1. pnpm add @sentry/nextjs
 *   2. Set NEXT_PUBLIC_SENTRY_DSN in .env
 *   3. Run npx @sentry/wizard@latest -i nextjs
 */

let sentryModule: { captureException: (err: unknown, ctx?: Record<string, unknown>) => void } | null = null;
let sentryLoaded = false;

async function loadSentry() {
  if (sentryLoaded) return sentryModule;
  sentryLoaded = true;
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return null;
  try {
    const mod = await import("@sentry/nextjs");
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

export async function reportError(
  error: unknown,
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> }
) {
  // Always log locally
  console.error("[FleteYa Error]", error, context);

  const sentry = await loadSentry();
  if (sentry) {
    sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
    } as Record<string, unknown>);
  }
}

export function reportErrorSync(error: unknown, context?: { tags?: Record<string, string> }) {
  console.error("[FleteYa Error]", error, context);
  void reportError(error, context);
}
