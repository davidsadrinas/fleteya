import { beforeEach, describe, expect, it, vi } from "vitest";

const limitMock = vi.fn();
const ratelimitCtorMock = vi.fn();
const slidingWindowMock = vi.fn();
const redisCtorMock = vi.fn();

class MockRedis {
  constructor(options: unknown) {
    redisCtorMock(options);
  }
}

class MockRatelimit {
  static slidingWindow(...args: unknown[]) {
    return slidingWindowMock(...args);
  }

  constructor(options: unknown) {
    ratelimitCtorMock(options);
  }

  limit(...args: unknown[]) {
    return limitMock(...args);
  }
}

vi.mock("@upstash/redis", () => ({
  Redis: MockRedis,
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: MockRatelimit,
}));

describe("rate-limit distributed mode", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  });

  it("uses Upstash limiter when env vars are present", async () => {
    limitMock.mockResolvedValue({
      success: true,
      remaining: 5,
      reset: Date.now() + 5_000,
    });

    const { enforceRateLimit } = await import("@/lib/rate-limit");
    const result = await enforceRateLimit({
      key: "distributed:key:1",
      max: 10,
      windowMs: 60_000,
    });

    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(5);
    expect(redisCtorMock).toHaveBeenCalledOnce();
    expect(ratelimitCtorMock).toHaveBeenCalledOnce();
    expect(limitMock).toHaveBeenCalledWith("distributed:key:1");
  });

  it("returns blocked response when Upstash reports limit exceeded", async () => {
    limitMock.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 1_000,
    });

    const { enforceRateLimit } = await import("@/lib/rate-limit");
    const result = await enforceRateLimit({
      key: "distributed:key:2",
      max: 2,
      windowMs: 2_000,
    });

    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });
});
