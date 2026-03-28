import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMIT_MAX_ENTRIES, RATE_LIMIT_CLEANUP_INTERVAL_MS } from "@shared/constants";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();
const distributedLimiters = new Map<string, Ratelimit>();
let lastCleanup = Date.now();
let warnedOnce = false;

function cleanupExpiredBuckets() {
  const now = Date.now();
  if (now - lastCleanup < RATE_LIMIT_CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  // Hard cap: if still too large after cleanup, evict oldest entries
  if (buckets.size > RATE_LIMIT_MAX_ENTRIES) {
    const entries = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    const toDelete = entries.slice(0, buckets.size - RATE_LIMIT_MAX_ENTRIES);
    for (const [key] of toDelete) {
      buckets.delete(key);
    }
  }
}

function getDistributedLimiter(max: number, windowMs: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  const cacheKey = `${max}:${windowMs}`;
  const existing = distributedLimiters.get(cacheKey);
  if (existing) return existing;

  const redis = new Redis({ url, token });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${Math.ceil(windowMs / 1000)} s`),
    analytics: true,
    prefix: "fletaya:ratelimit",
  });
  distributedLimiters.set(cacheKey, limiter);
  return limiter;
}

export function getRequesterIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}

export async function enforceRateLimit(input: {
  key: string;
  max: number;
  windowMs: number;
}): Promise<{ ok: boolean; retryAfterSeconds: number; remaining: number }> {
  const distributed = getDistributedLimiter(input.max, input.windowMs);
  if (distributed) {
    const result = await distributed.limit(input.key);
    return {
      ok: result.success,
      retryAfterSeconds: Math.max(1, Math.ceil(((result.reset ?? Date.now() + input.windowMs) - Date.now()) / 1000)),
      remaining: Math.max(0, result.remaining ?? 0),
    };
  }

  // In-memory fallback — not distributed across serverless instances
  if (process.env.NODE_ENV === "production" && !warnedOnce) {
    warnedOnce = true;
    console.warn("[rate-limit] UPSTASH_REDIS_REST_URL not set — using in-memory fallback. Rate limits will not be shared across instances.");
  }
  cleanupExpiredBuckets();

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
