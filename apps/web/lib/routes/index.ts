import { googleDirectionsAdapter } from "./adapters/google-directions";
import { haversineFallbackAdapter } from "./adapters/haversine-fallback";
import type { RoutePoint, RouteResult, RoutingAdapter } from "./types";

export interface MultiStopRouteResult {
  legs: RouteResult[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
}

function getRoutingAdapter(): RoutingAdapter {
  const provider = (process.env.ROUTING_PROVIDER ?? "google").toLowerCase();
  if (provider === "haversine") return haversineFallbackAdapter;
  return googleDirectionsAdapter;
}

export async function calculateRoute(origin: RoutePoint, destination: RoutePoint): Promise<RouteResult | null> {
  const adapter = getRoutingAdapter();
  const primaryResult = await adapter.calculateRoute(origin, destination);
  if (primaryResult) return primaryResult;
  if (adapter === haversineFallbackAdapter) return null;
  return haversineFallbackAdapter.calculateRoute(origin, destination);
}

export async function calculateMultiStopRoute(
  stops: RoutePoint[]
): Promise<MultiStopRouteResult | null> {
  if (stops.length < 2) return null;

  const legs: RouteResult[] = [];

  for (let i = 0; i < stops.length - 1; i++) {
    const leg = await calculateRoute(stops[i], stops[i + 1]);
    if (!leg) return null;
    legs.push(leg);
  }

  return {
    legs,
    totalDistanceKm: legs.reduce((sum, l) => sum + l.distanceKm, 0),
    totalDurationMinutes: legs.reduce((sum, l) => sum + l.durationMinutes, 0),
  };
}

export function isRoutesConfigured(): boolean {
  return getRoutingAdapter().isConfigured();
}

export type { RoutePoint, RouteResult } from "./types";
