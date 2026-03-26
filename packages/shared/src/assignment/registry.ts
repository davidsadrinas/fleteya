import type { AssignmentStrategy, AssignmentStrategyId } from "./types";
import { defaultAssignmentStrategyV1 } from "./strategies/default-v1";
import { proximityThenRatingStrategyV1 } from "./strategies/proximity-then-rating-v1";

const strategies = new Map<AssignmentStrategyId, AssignmentStrategy>([
  [proximityThenRatingStrategyV1.id, proximityThenRatingStrategyV1],
  [defaultAssignmentStrategyV1.id, defaultAssignmentStrategyV1],
]);

export function getAssignmentStrategy(
  id: AssignmentStrategyId | null | undefined
): AssignmentStrategy {
  if (id && strategies.has(id)) {
    return strategies.get(id)!;
  }
  return proximityThenRatingStrategyV1;
}

/** Register additional strategies at app startup (e.g. `default_v2`, A/B tests). */
export function registerAssignmentStrategy(strategy: AssignmentStrategy): void {
  strategies.set(strategy.id, strategy);
}

export function listBuiltinAssignmentStrategyIds(): AssignmentStrategyId[] {
  return Array.from(strategies.keys());
}
