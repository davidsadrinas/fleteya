import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";

export async function startDriverLocationShare(shipmentId: string): Promise<Location.LocationSubscription | null> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") return null;

  await Location.requestBackgroundPermissionsAsync();

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
      distanceInterval: 10,
    },
    async (position) => {
      const { error } = await supabase.from("tracking_points").insert({
        shipment_id: shipmentId,
        location: `POINT(${position.coords.longitude} ${position.coords.latitude})`,
        speed: position.coords.speed,
        heading: position.coords.heading,
      });
      if (error) {
        console.warn("No se pudo insertar tracking point", error.message);
      }
    }
  );
}
