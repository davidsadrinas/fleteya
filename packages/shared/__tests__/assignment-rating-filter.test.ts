import { describe, expect, it } from "vitest";
import { MIN_DRIVER_RATING } from "../src/constants/index";
import {
  proximityThenRatingStrategyV1,
  defaultAssignmentStrategyV1,
} from "../src/assignment/index";
import type { AssignmentCandidate } from "../src/assignment/types";

function makeCandidate(overrides: Partial<AssignmentCandidate> & { applicationId: string; driverId: string }): AssignmentCandidate {
  return {
    rating: 4.5,
    totalTrips: 10,
    verified: true,
    distanceFromPickupMeters: 5000,
    ...overrides,
  };
}

describe("MIN_DRIVER_RATING constant", () => {
  it("is set to 3.0", () => {
    expect(MIN_DRIVER_RATING).toBe(3.0);
  });

  it("is a reasonable value between 1 and 5", () => {
    expect(MIN_DRIVER_RATING).toBeGreaterThanOrEqual(1);
    expect(MIN_DRIVER_RATING).toBeLessThanOrEqual(5);
  });
});

describe("Assignment strategies with low-rated drivers", () => {
  const highRated = makeCandidate({ applicationId: "a1", driverId: "d1", rating: 4.8, totalTrips: 50 });
  const midRated = makeCandidate({ applicationId: "a2", driverId: "d2", rating: 3.5, totalTrips: 20 });
  const lowRated = makeCandidate({ applicationId: "a3", driverId: "d3", rating: 2.0, totalTrips: 5 });

  describe("proximity_then_rating_v1", () => {
    it("never selects lowest-rated when higher options exist", () => {
      const winner = proximityThenRatingStrategyV1.selectBest(
        [lowRated, midRated, highRated],
        { shipmentId: "s1" }
      );
      expect(winner?.applicationId).toBe("a1");
    });

    it("selects only candidate even if low-rated", () => {
      const winner = proximityThenRatingStrategyV1.selectBest(
        [lowRated],
        { shipmentId: "s1" }
      );
      // Strategy still returns it — filtering by MIN_DRIVER_RATING happens at the caller level
      expect(winner?.applicationId).toBe("a3");
    });
  });

  describe("default_v1", () => {
    it("prefers high-rated over low-rated at same distance", () => {
      const winner = defaultAssignmentStrategyV1.selectBest(
        [lowRated, highRated],
        { shipmentId: "s1" }
      );
      expect(winner?.applicationId).toBe("a1");
    });
  });
});

describe("Proximity bands with chain distance", () => {
  it("prefers driver whose chain end is closer to pickup", () => {
    const farGps = makeCandidate({
      applicationId: "a1",
      driverId: "d1",
      rating: 4.5,
      distanceFromPickupMeters: 30_000, // 30km away by GPS
      chainDistanceMeters: 3_000, // but chain end is 3km from pickup
    });
    const nearGps = makeCandidate({
      applicationId: "a2",
      driverId: "d2",
      rating: 4.0,
      distanceFromPickupMeters: 8_000, // 8km by GPS
    });

    const winner = proximityThenRatingStrategyV1.selectBest(
      [farGps, nearGps],
      { shipmentId: "s1" }
    );
    // farGps has effective distance 3km (chain), so lands in tighter band
    // nearGps has effective distance 8km
    // Both are in 10km band, but farGps has higher rating
    expect(winner?.applicationId).toBe("a1");
  });
});
