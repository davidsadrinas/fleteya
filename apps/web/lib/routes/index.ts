import { reportError } from "@/lib/error-reporting";

interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  polyline: string;
  distanceText: string;
  durationText: string;
}

export interface MultiStopRouteResult {
  legs: RouteResult[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
}

const DIRECTIONS_API = "https://maps.googleapis.com/maps/api/directions/json";

export async function calculateRoute(
  origin: RoutePoint,
  destination: RoutePoint
): Promise<RouteResult | null> {
  const apiKey =
    process.env.GOOGLE_DIRECTIONS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    return null;
  }

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
    await reportError(err, { tags: { service: "routes" } });
    return null;
  }
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
  return !!(process.env.GOOGLE_DIRECTIONS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY);
}
