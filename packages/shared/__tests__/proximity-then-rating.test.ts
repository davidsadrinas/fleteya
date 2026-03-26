import { describe, expect, it } from "vitest";
import {
  PROXIMITY_BANDS_METERS,
  effectiveDistanceMeters,
  proximityThenRatingStrategyV1,
} from "../src/assignment/index";
import type { AssignmentCandidate } from "../src/assignment/types";

const base = (over: Partial<AssignmentCandidate>): AssignmentCandidate => ({
  applicationId: "a",
  driverId: "d",
  rating: 4,
  totalTrips: 10,
  verified: true,
  ...over,
});

describe("proximityThenRatingStrategyV1", () => {
  it("uses ordered proximity bands", () => {
    expect(PROXIMITY_BANDS_METERS[0]).toBeLessThan(PROXIMITY_BANDS_METERS[1]);
  });

  it("within the same band picks higher rating over proximity", () => {
    const inner: AssignmentCandidate = base({
      applicationId: "near_low",
      rating: 4.0,
      distanceFromPickupMeters: 2000,
    });
    const innerBetterRated: AssignmentCandidate = base({
      applicationId: "near_high",
      driverId: "d2",
      rating: 4.9,
      distanceFromPickupMeters: 4000,
    });
    const winner = proximityThenRatingStrategyV1.selectBest([inner, innerBetterRated], {
      shipmentId: "s",
    });
    expect(winner?.applicationId).toBe("near_high");
  });

  it("inner band wins over outer band despite lower rating", () => {
    const closeLowRating: AssignmentCandidate = base({
      applicationId: "close",
      rating: 3.0,
      distanceFromPickupMeters: 3000,
    });
    const farHighRating: AssignmentCandidate = base({
      applicationId: "far",
      driverId: "d2",
      rating: 5.0,
      distanceFromPickupMeters: 60_000,
    });
    const winner = proximityThenRatingStrategyV1.selectBest([closeLowRating, farHighRating], {
      shipmentId: "s",
    });
    expect(winner?.applicationId).toBe("close");
  });

  it("chain distance tightens effective reach (encadenado)", () => {
    const chained: AssignmentCandidate = base({
      applicationId: "chain",
      rating: 4.0,
      distanceFromPickupMeters: 100_000,
      chainDistanceMeters: 2000,
    });
    const noChain: AssignmentCandidate = base({
      applicationId: "gps",
      driverId: "d2",
      rating: 5.0,
      distanceFromPickupMeters: 15_000,
    });
    expect(effectiveDistanceMeters(chained)).toBe(2000);
    const winner = proximityThenRatingStrategyV1.selectBest([chained, noChain], {
      shipmentId: "s",
    });
    expect(winner?.applicationId).toBe("chain");
  });
});
