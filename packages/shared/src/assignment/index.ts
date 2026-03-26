export {
  DEFAULT_V1_WEIGHTS,
  defaultAssignmentStrategyV1,
  scoreDefaultV1,
} from "./strategies/default-v1";
export {
  PROXIMITY_BANDS_METERS,
  effectiveDistanceMeters,
  pickHighestRatedCandidate,
  proximityThenRatingStrategyV1,
} from "./strategies/proximity-then-rating-v1";
export { haversineDistanceMeters } from "./geo";
export {
  getAssignmentStrategy,
  listBuiltinAssignmentStrategyIds,
  registerAssignmentStrategy,
} from "./registry";
export type {
  AssignmentCandidate,
  AssignmentStrategy,
  AssignmentStrategyId,
  ShipmentAssignmentMeta,
} from "./types";
