import { useEffect, useState, useCallback, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-client";
import { useTrackingStore } from "@/lib/stores";
import { apiFetch } from "@/lib/api-fetch";

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
  const queryColumn = query?.column;
  const queryValue = query?.value;

  useEffect(() => {
    if (!enabled) return;
    const fetch = async () => {
      setLoading(true);
      let q = supabase.from(table).select("*");
      if (queryColumn && queryValue) q = q.eq(queryColumn, queryValue);
      const { data, error } = await q;
      if (error) setError(error.message);
      else setData(data as T[]);
      setLoading(false);
    };
    fetch();
  }, [table, queryColumn, queryValue, enabled]);

  return { data, loading, error };
}

// Auth session hook
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
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
          const point = payload.new as { location?: string | null };
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
          const next = (payload.new as { status?: string | null }).status;
          if (next) setStatus(next);
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
  const watchIdRef = useRef<number | null>(null);
  const lastSentAtRef = useRef(0);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  }, []);

  const start = useCallback(async () => {
    if (!shipmentId || !navigator.geolocation) return;
    if (watchIdRef.current !== null) return;
    setSharing(true);

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastSentAtRef.current < 5000) return;
        lastSentAtRef.current = now;
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
    watchIdRef.current = watchId;
  }, [shipmentId]);

  useEffect(() => stop, [stop]);

  return { sharing, start, stop };
}

// Web push notification subscription
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setLoading(false);
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn("VAPID public key not configured");
        setLoading(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      const subJson = subscription.toJSON();
      await apiFetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        }),
      });

      setSubscribed(true);
    } catch (err) {
      console.error("Push subscription error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await apiFetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { permission, subscribed, loading, subscribe, unsubscribe };
}
