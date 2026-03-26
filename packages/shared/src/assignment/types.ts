export type AssignmentStrategyId = string;

export interface ShipmentAssignmentMeta {
  shipmentId: string;
  firstLegOriginLat?: number;
  firstLegOriginLng?: number;
}

/** One pending application + driver signals used by matchers. */
export interface AssignmentCandidate {
  applicationId: string;
  driverId: string;
  rating: number;
  totalTrips: number;
  verified: boolean;
  /** Distance from posted GPS to first pickup (meters). */
  distanceFromPickupMeters?: number;
  /**
   * Distance from new pickup to where this driver ends their **current** trip
   * (last leg destination). Drives priority for same-day chained loads / backhaul.
   */
  chainDistanceMeters?: number;
}

/**
 * Pluggable assignment rule set. Implement new versions (e.g. default_v2) or
 * register runtime via registerAssignmentStrategy.
 */
export interface AssignmentStrategy {
  readonly id: AssignmentStrategyId;
  selectBest(
    candidates: AssignmentCandidate[],
    meta: ShipmentAssignmentMeta
  ): AssignmentCandidate | null;
}
