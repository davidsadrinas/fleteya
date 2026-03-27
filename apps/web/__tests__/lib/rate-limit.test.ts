import { describe, expect, it, vi } from "vitest";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";

describe("rate-limit utils", () => {
  it("extracts requester ip from x-forwarded-for first value", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    });
    expect(getRequesterIp(headers)).toBe("1.2.3.4");
  });

  it("allows until max and blocks after max", () => {
    const key = `test-key-${Date.now()}`;
    const a = enforceRateLimit({ key, max: 2, windowMs: 10_000 });
    const b = enforceRateLimit({ key, max: 2, windowMs: 10_000 });
    const c = enforceRateLimit({ key, max: 2, windowMs: 10_000 });

    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(c.ok).toBe(false);
    expect(c.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    vi.useFakeTimers();
    const key = `window-reset-${Date.now()}`;

    expect(enforceRateLimit({ key, max: 1, windowMs: 1_000 }).ok).toBe(true);
    expect(enforceRateLimit({ key, max: 1, windowMs: 1_000 }).ok).toBe(false);

    vi.advanceTimersByTime(1_100);
    expect(enforceRateLimit({ key, max: 1, windowMs: 1_000 }).ok).toBe(true);
    vi.useRealTimers();
  });
});
