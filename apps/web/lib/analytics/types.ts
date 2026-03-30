export interface AnalyticsAdapter {
  readonly name: string;
  isConfigured(): boolean;
  trackEvent(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>
  ): Promise<void>;
}
