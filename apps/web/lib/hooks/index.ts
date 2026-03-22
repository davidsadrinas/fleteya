import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import { useTrackingStore } from "@/lib/stores";

const supabase = createClient();

// Generic data fetcher
export function useSupabaseQuery<T>(
  table: string,
  query?: { column: string; value: string },
  enabled: boolean = true
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const fetch = async () => {
      setLoading(true);
      let q = supabase.from(table).select("*");
      if (query) q = q.eq(query.column, query.value);
      const { data, error } = await q;
      if (error) setError(error.message);
      else setData(data as T[]);
      setLoading(false);
    };
    fetch();
  }, [table, query?.value, enabled]);

  return { data, loading, error };
}

// Auth session hook
export function useSession() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user: session?.user, loading };
}

// Realtime tracking subscription
export function useRealtimeTracking(shipmentId: string | null) {
  const { updatePosition } = useTrackingStore();

  useEffect(() => {
    if (!shipmentId) return;

    const channel = supabase
      .channel(`tracking:${shipmentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tracking_points",
          filter: `shipment_id=eq.${shipmentId}`,
        },
        (payload) => {
          const point = payload.new as any;
          // PostGIS geography returns WKT, extract lat/lng
          if (point.location) {
            // Simple extraction from POINT(lng lat) format
            const match = point.location.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
            if (match) {
              updatePosition({ lng: parseFloat(match[1]), lat: parseFloat(match[2]) });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId, updatePosition]);
}

// Realtime shipment status subscription
export function useRealtimeShipmentStatus(shipmentId: string | null) {
  const [status, setStatus] = useState<string>("pending");

  useEffect(() => {
    if (!shipmentId) return;

    const channel = supabase
      .channel(`shipment:${shipmentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shipments",
          filter: `id=eq.${shipmentId}`,
        },
        (payload) => {
          setStatus((payload.new as any).status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId]);

  return status;
}

// Driver location sharing (for driver app)
export function useShareLocation(shipmentId: string | null) {
  const [sharing, setSharing] = useState(false);

  const start = useCallback(async () => {
    if (!shipmentId || !navigator.geolocation) return;
    setSharing(true);

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        await supabase.from("tracking_points").insert({
          shipment_id: shipmentId,
          location: `POINT(${pos.coords.longitude} ${pos.coords.latitude})`,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
        });
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setSharing(false);
    };
  }, [shipmentId]);

  return { sharing, start };
}
