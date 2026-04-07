export interface RoutePoint {
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

export interface RoutingAdapter {
  isConfigured(): boolean;
  calculateRoute(origin: RoutePoint, destination: RoutePoint): Promise<RouteResult | null>;
}
