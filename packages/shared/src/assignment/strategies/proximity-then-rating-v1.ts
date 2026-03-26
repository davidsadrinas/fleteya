import type {
  AssignmentCandidate,
  AssignmentStrategy,
  ShipmentAssignmentMeta,
} from "../types";

/**
 * Ordered proximity bands (meters from effective position to pickup).
 * Tightest band first: within each band, winner is highest in-app rating (then trips, verified).
 */
export const PROXIMITY_BANDS_METERS = [10_000, 25_000, 80_000] as const;

/** Best-case reach: chain end or GPS postulación (optimistic for encadenados). */
export function effectiveDistanceMeters(c: AssignmentCandidate): number {
  const chain = c.chainDistanceMeters;
  const app = c.distanceFromPickupMeters;
  const parts: number[] = [];
  if (chain != null && !Number.isNaN(chain)) parts.push(chain);
  if (app != null && !Number.isNaN(app)) parts.push(app);
  if (parts.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...parts);
}

export function pickHighestRatedCandidate(
  list: AssignmentCandidate[]
): AssignmentCandidate | null {
  if (list.length === 0) return null;
  let best = list[0];
  for (let i = 1; i < list.length; i++) {
    const c = list[i];
    if (c.rating > best.rating) best = c;
    else if (c.rating === best.rating && c.totalTrips > best.totalTrips) best = c;
    else if (
      c.rating === best.rating &&
      c.totalTrips === best.totalTrips &&
      c.verified &&
      !best.verified
    )
      best = c;
  }
  return best;
}

export const proximityThenRatingStrategyV1: AssignmentStrategy = {
  id: "proximity_then_rating_v1",
  selectBest(candidates, _meta: ShipmentAssignmentMeta) {
    if (candidates.length === 0) return null;

    for (const maxRadius of PROXIMITY_BANDS_METERS) {
      const inBand = candidates.filter((c) => effectiveDistanceMeters(c) <= maxRadius);
      if (inBand.length > 0) {
        return pickHighestRatedCandidate(inBand);
      }
    }

    return pickHighestRatedCandidate(candidates);
  },
};
