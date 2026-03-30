export interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export interface ErrorReportingAdapter {
  readonly name: string;
  isConfigured(): boolean;
  report(error: unknown, context?: ErrorContext): Promise<void>;
}
