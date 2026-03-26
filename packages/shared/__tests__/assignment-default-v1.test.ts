import { describe, expect, it } from "vitest";
import {
  defaultAssignmentStrategyV1,
  getAssignmentStrategy,
  haversineDistanceMeters,
  registerAssignmentStrategy,
  scoreDefaultV1,
} from "../src/assignment/index";
import type { AssignmentCandidate, AssignmentStrategy } from "../src/assignment/types";

describe("haversineDistanceMeters", () => {
  it("returns ~0 for same point", () => {
    expect(haversineDistanceMeters(-34.6, -58.4, -34.6, -58.4)).toBeLessThan(1);
  });

  it("is positive for distinct points", () => {
    const d = haversineDistanceMeters(-34.6, -58.4, -34.7, -58.5);
    expect(d).toBeGreaterThan(1000);
  });
});

describe("defaultAssignmentStrategyV1", () => {
  it("returns null for empty list", () => {
    expect(
      defaultAssignmentStrategyV1.selectBest([], { shipmentId: "s1" })
    ).toBeNull();
  });

  it("prefers higher rating when distance is similar", () => {
    const a: AssignmentCandidate = {
      applicationId: "a1",
      driverId: "d1",
      rating: 4.9,
      totalTrips: 10,
      verified: true,
      distanceFromPickupMeters: 5000,
    };
    const b: AssignmentCandidate = {
      applicationId: "a2",
      driverId: "d2",
      rating: 3.0,
      totalTrips: 100,
      verified: true,
      distanceFromPickupMeters: 5000,
    };
    const winner = defaultAssignmentStrategyV1.selectBest([a, b], {
      shipmentId: "s1",
    });
    expect(winner?.applicationId).toBe("a1");
  });

  it("scoreDefaultV1 treats closer drivers better when other signals equal", () => {
    const base: AssignmentCandidate = {
      applicationId: "x",
      driverId: "d",
      rating: 4,
      totalTrips: 20,
      verified: true,
    };
    const near = { ...base, distanceFromPickupMeters: 1000 };
    const far = { ...base, applicationId: "y", distanceFromPickupMeters: 50_000 };
    expect(scoreDefaultV1(near)).toBeGreaterThan(scoreDefaultV1(far));
  });
});

describe("getAssignmentStrategy registry", () => {
  it("falls back to proximity_then_rating_v1 for unknown id", () => {
    const s = getAssignmentStrategy("nonexistent");
    expect(s.id).toBe("proximity_then_rating_v1");
  });

  it("supports custom registered strategies", () => {
    const tie: AssignmentStrategy = {
      id: "tie_break_first",
      selectBest(candidates) {
        return candidates[0] ?? null;
      },
    };
    registerAssignmentStrategy(tie);
    expect(getAssignmentStrategy("tie_break_first").id).toBe("tie_break_first");
  });
});
