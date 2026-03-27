type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function getRequesterIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}

export function enforceRateLimit(input: {
  key: string;
  max: number;
  windowMs: number;
}): { ok: boolean; retryAfterSeconds: number; remaining: number } {
  const now = Date.now();
  const existing = buckets.get(input.key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return {
      ok: true,
      retryAfterSeconds: Math.ceil(input.windowMs / 1000),
      remaining: Math.max(0, input.max - 1),
    };
  }

  existing.count += 1;
  buckets.set(input.key, existing);

  const remaining = Math.max(0, input.max - existing.count);
  const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
  if (existing.count > input.max) {
    return { ok: false, retryAfterSeconds, remaining: 0 };
  }
  return { ok: true, retryAfterSeconds, remaining };
}
