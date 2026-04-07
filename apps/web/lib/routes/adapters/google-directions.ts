import { reportError } from "@/lib/error-reporting";
import type { RoutePoint, RouteResult, RoutingAdapter } from "../types";

const DIRECTIONS_API = "https://maps.googleapis.com/maps/api/directions/json";

export const googleDirectionsAdapter: RoutingAdapter = {
  isConfigured() {
    return !!(process.env.GOOGLE_DIRECTIONS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY);
  },

  async calculateRoute(origin: RoutePoint, destination: RoutePoint): Promise<RouteResult | null> {
    const apiKey =
      process.env.GOOGLE_DIRECTIONS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey) return null;

    try {
      const url = new URL(DIRECTIONS_API);
      url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
      url.searchParams.set("destination", `${destination.lat},${destination.lng}`);
      url.searchParams.set("mode", "driving");
      url.searchParams.set("language", "es");
      url.searchParams.set("region", "ar");
      url.searchParams.set("key", apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== "OK" || !data.routes?.[0]) {
        console.warn(`[Routes] Directions API status: ${data.status}`);
        return null;
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distanceKm: leg.distance.value / 1000,
        durationMinutes: Math.ceil(leg.duration.value / 60),
        polyline: route.overview_polyline.points,
        distanceText: leg.distance.text,
        durationText: leg.duration.text,
      };
    } catch (err) {
      await reportError(err, { tags: { service: "routes", provider: "google-directions" } });
      return null;
    }
  },
};
