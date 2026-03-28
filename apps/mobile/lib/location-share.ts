import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { trackingQueue } from "@/lib/offline-queue";

let flushInterval: ReturnType<typeof setInterval> | null = null;

export async function startDriverLocationShare(shipmentId: string): Promise<Location.LocationSubscription | null> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") return null;

  await Location.requestBackgroundPermissionsAsync();

  // Periodically flush offline queue
  if (flushInterval) clearInterval(flushInterval);
  flushInterval = setInterval(async () => {
    if (trackingQueue.size() > 0) {
      const synced = await trackingQueue.flush(supabase);
      if (synced > 0) console.log(`Synced ${synced} queued tracking points`);
    }
  }, 15_000);

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
      distanceInterval: 10,
    },
    async (position) => {
      const point = {
        shipment_id: shipmentId,
        location: `POINT(${position.coords.longitude} ${position.coords.latitude})`,
        speed: position.coords.speed,
        heading: position.coords.heading,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("tracking_points").insert(point);
      if (error) {
        console.warn("Queuing tracking point offline:", error.message);
        trackingQueue.enqueue(point);
      }
    }
  );
}

export function stopDriverLocationFlush() {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}
