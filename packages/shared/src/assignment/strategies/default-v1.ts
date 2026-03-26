import type {
  AssignmentCandidate,
  AssignmentStrategy,
  ShipmentAssignmentMeta,
} from "../types";

/** Tunable weights — future strategies can copy or load from config service. */
export const DEFAULT_V1_WEIGHTS = {
  rating: 3,
  tripsCap: 500,
  trips: 0.02,
  /** Added to score per meter (negative = closer is better). */
  distancePerMeter: -0.001,
  /** Default assumed distance (m) when pickup or driver position unknown. */
  unknownDistanceMeters: 50_000,
  verifiedBonus: 2,
} as const;

export function scoreDefaultV1(c: AssignmentCandidate): number {
  const w = DEFAULT_V1_WEIGHTS;
  const dist = c.distanceFromPickupMeters ?? w.unknownDistanceMeters;
  return (
    c.rating * w.rating +
    Math.min(c.totalTrips, w.tripsCap) * w.trips +
    dist * w.distancePerMeter +
    (c.verified ? w.verifiedBonus : 0)
  );
}

export const defaultAssignmentStrategyV1: AssignmentStrategy = {
  id: "default_v1",
  selectBest(candidates, _meta) {
    if (candidates.length === 0) return null;
    let best: AssignmentCandidate | null = null;
    let bestScore = -Infinity;
    for (const c of candidates) {
      const s = scoreDefaultV1(c);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }
    return best;
  },
};
