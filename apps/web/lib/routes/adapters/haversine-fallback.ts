import { calcDistanceKm } from "@shared/utils";
import type { RoutePoint, RouteResult, RoutingAdapter } from "../types";

export const haversineFallbackAdapter: RoutingAdapter = {
  isConfigured() {
    return true;
  },

  async calculateRoute(origin: RoutePoint, destination: RoutePoint): Promise<RouteResult | null> {
    const distKm = calcDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng) * 1.3;
    const durationMinutes = Math.ceil((distKm / 30) * 60);
    return {
      distanceKm: distKm,
      durationMinutes,
      polyline: "",
      distanceText: `${distKm.toFixed(1)} km`,
      durationText: `${durationMinutes} min`,
    };
  },
};
