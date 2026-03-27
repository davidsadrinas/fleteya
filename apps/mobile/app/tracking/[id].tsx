import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import type { ShipmentStatus } from "@shared/types";
import { STATUS_META } from "@shared/types";
import { supabase } from "@/lib/supabase";
import { startDriverLocationShare } from "@/lib/location-share";
import type { LocationSubscription } from "expo-location";

type TrackingPoint = { lat: number; lng: number };

const WKT_REGEX = /POINT\(([-\d.]+)\s+([-\d.]+)\)/;

function parseTrackingLocation(input: unknown): TrackingPoint | null {
  if (typeof input !== "string") return null;
  const match = input.match(WKT_REGEX);
  if (!match?.[1] || !match[2]) return null;
  const lng = Number(match[1]);
  const lat = Number(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shipmentId = id ?? "";
  const [status, setStatus] = useState<ShipmentStatus>("pending");
  const [points, setPoints] = useState<TrackingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const sharingRef = useRef<LocationSubscription | null>(null);

  useEffect(() => {
    if (!shipmentId) return;

    const bootstrap = async () => {
      const { data: shipment } = await supabase
        .from("shipments")
        .select("status")
        .eq("id", shipmentId)
        .maybeSingle();
      if (shipment?.status) setStatus(shipment.status as ShipmentStatus);

      const { data: trackingRows } = await supabase
        .from("tracking_points")
        .select("location")
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: true })
        .limit(200);

      const parsed =
        trackingRows
          ?.map((row) => parseTrackingLocation((row as { location: unknown }).location))
          .filter((point): point is TrackingPoint => Boolean(point)) ?? [];
      setPoints(parsed);
      setLoading(false);
    };
    void bootstrap();

    const pointsChannel = supabase
      .channel(`tracking_points_${shipmentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tracking_points",
          filter: `shipment_id=eq.${shipmentId}`,
        },
        (payload) => {
          const raw = (payload.new as { location?: unknown }).location;
          const point = parseTrackingLocation(raw);
          if (point) {
            setPoints((prev) => [...prev, point].slice(-500));
          }
        }
      )
      .subscribe();

    const shipmentChannel = supabase
      .channel(`shipment_status_${shipmentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shipments",
          filter: `id=eq.${shipmentId}`,
        },
        (payload) => {
          const raw = (payload.new as { status?: unknown }).status;
          if (typeof raw === "string") setStatus(raw as ShipmentStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pointsChannel);
      supabase.removeChannel(shipmentChannel);
      sharingRef.current?.remove();
      sharingRef.current = null;
    };
  }, [shipmentId]);

  const current = points[points.length - 1];
  const statusMeta = useMemo(() => STATUS_META[status], [status]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#40916C" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Tracking en vivo</Text>
        <View style={[styles.badge, { backgroundColor: `${statusMeta.color}22` }]}>
          <Text style={[styles.badgeText, { color: statusMeta.color }]}>
            {statusMeta.icon} {statusMeta.label}
          </Text>
        </View>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: current?.lat ?? -34.6037,
          longitude: current?.lng ?? -58.3816,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {points.length > 0 ? (
          <Polyline
            coordinates={points.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor="#40916C"
            strokeWidth={4}
          />
        ) : null}
        {current ? (
          <Marker coordinate={{ latitude: current.lat, longitude: current.lng }} title="Fletero" />
        ) : null}
      </MapView>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Puntos recibidos: {points.length}</Text>
        <Text style={styles.footerText}>
          El mapa se actualiza automaticamente con Supabase Realtime.
        </Text>
        <Pressable
          style={[styles.shareButton, sharing ? styles.shareButtonActive : undefined]}
          onPress={() => {
            if (!shipmentId) return;
            if (sharing) {
              sharingRef.current?.remove();
              sharingRef.current = null;
              setSharing(false);
              return;
            }
            startDriverLocationShare(shipmentId)
              .then((subscription) => {
                if (subscription) {
                  sharingRef.current = subscription;
                  setSharing(true);
                }
              })
              .catch(() => setSharing(false));
          }}
        >
          <Text style={styles.shareButtonText}>
            {sharing ? "Compartiendo GPS del fletero" : "Iniciar compartir GPS"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  title: { color: "#1B4332", fontWeight: "800", fontSize: 22, marginBottom: 6 },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  map: { flex: 1, marginTop: 6 },
  footer: { padding: 14, borderTopWidth: 1, borderTopColor: "#DFE6E9", backgroundColor: "#FFFFFF" },
  footerTitle: { color: "#2D3436", fontWeight: "700", marginBottom: 3 },
  footerText: { color: "#7B8794", fontSize: 12 },
  shareButton: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFB",
  },
  shareButtonActive: { borderColor: "#40916C", backgroundColor: "#E8F5EC" },
  shareButtonText: { color: "#1B4332", fontSize: 12, fontWeight: "700" },
});
