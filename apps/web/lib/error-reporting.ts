import { sentryErrorReportingAdapter } from "./error-reporting/adapters/sentry";
import type { ErrorContext, ErrorReportingAdapter } from "./error-reporting/types";

const adapters: Record<string, ErrorReportingAdapter> = {
  sentry: sentryErrorReportingAdapter,
};

function getErrorReportingAdapter(): ErrorReportingAdapter {
  const provider = process.env.ERROR_REPORTING_PROVIDER?.trim().toLowerCase() || "sentry";
  return adapters[provider] ?? sentryErrorReportingAdapter;
}

export async function reportError(
  error: unknown,
  context?: ErrorContext
) {
  // Always log locally
  console.error("[FleteYa Error]", error, context);

  const adapter = getErrorReportingAdapter();
  if (!adapter.isConfigured()) return;
  await adapter.report(error, context);
}

export function reportErrorSync(error: unknown, context?: ErrorContext) {
  console.error("[FleteYa Error]", error, context);
  void reportError(error, context);
}
