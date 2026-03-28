import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import type { ShipmentStatus } from "@shared/types";
import { STATUS_META } from "@shared/types";
import { supabase } from "@/lib/supabase";
import { startDriverLocationShare, stopDriverLocationFlush } from "@/lib/location-share";
import type { LocationSubscription } from "expo-location";
import ChatPanel from "@/components/chat-panel";
import EvidencePanel from "@/components/evidence-panel";
import DisputesPanel from "@/components/disputes-panel";

type TrackingPoint = { lat: number; lng: number };
type Panel = "map" | "chat" | "evidence" | "disputes";

const WKT_REGEX = /POINT\(([-\d.]+)\s+([-\d.]+)\)/;
const PANELS: { key: Panel; label: string }[] = [
  { key: "map", label: "Mapa" },
  { key: "chat", label: "Chat" },
  { key: "evidence", label: "Fotos" },
  { key: "disputes", label: "Disputas" },
];

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
  const [canShare, setCanShare] = useState(false);
  const sharingRef = useRef<LocationSubscription | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("map");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!shipmentId) return;

    const bootstrap = async () => {
      const { data: shipment } = await supabase
        .from("shipments")
        .select("status,driver_id")
        .eq("id", shipmentId)
        .maybeSingle();
      if (shipment?.status) setStatus(shipment.status as ShipmentStatus);
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id ?? null;
      setUserId(uid);
      if (shipment?.driver_id && uid) {
        const { data: driverRow } = await supabase
          .from("drivers")
          .select("user_id")
          .eq("id", shipment.driver_id)
          .maybeSingle();
        setCanShare((driverRow as { user_id?: string | null } | null)?.user_id === uid);
      } else {
        setCanShare(false);
      }

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
      stopDriverLocationFlush();
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

      {/* Segment control */}
      <View style={styles.segments}>
        {PANELS.map((p) => (
          <Pressable
            key={p.key}
            style={[styles.segment, activePanel === p.key && styles.segmentActive]}
            onPress={() => setActivePanel(p.key)}
          >
            <Text style={[styles.segmentText, activePanel === p.key && styles.segmentTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {activePanel === "map" && (
        <>
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
              style={[styles.shareButton, sharing ? styles.shareButtonActive : undefined, !canShare ? styles.shareDisabled : undefined]}
              onPress={() => {
                if (!shipmentId || !canShare) return;
                if (sharing) {
                  sharingRef.current?.remove();
                  sharingRef.current = null;
                  setSharing(false);
                  stopDriverLocationFlush();
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
                {!canShare
                  ? "GPS compartido por fletero asignado"
                  : sharing
                  ? "Compartiendo GPS del fletero"
                  : "Iniciar compartir GPS"}
              </Text>
            </Pressable>
            {sharing ? (
              <Text style={styles.liveIndicator}>Compartiendo ubicación</Text>
            ) : null}
            {canShare ? (
              <View style={styles.statusGrid}>
                {[
                  { label: "Llegué al origen", value: "at_origin" },
                  { label: "Cargando", value: "loading" },
                  { label: "En tránsito", value: "in_transit" },
                  { label: "Llegando", value: "arriving" },
                  { label: "Entregado", value: "delivered" },
                ].map((next) => (
                  <Pressable
                    key={next.value}
                    disabled={updatingStatus}
                    style={styles.statusChip}
                    onPress={() => {
                      if (!shipmentId) return;
                      setUpdatingStatus(true);
                      void supabase
                        .from("shipments")
                        .update({ status: next.value, updated_at: new Date().toISOString() })
                        .eq("id", shipmentId)
                        .then(({ error }) => {
                          if (!error) setStatus(next.value as ShipmentStatus);
                        })
                        .finally(() => setUpdatingStatus(false));
                    }}
                  >
                    <Text style={styles.statusChipText}>{next.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </>
      )}

      {activePanel === "chat" && userId && (
        <ChatPanel shipmentId={shipmentId} userId={userId} />
      )}

      {activePanel === "evidence" && userId && (
        <EvidencePanel shipmentId={shipmentId} userId={userId} />
      )}

      {activePanel === "disputes" && userId && (
        <DisputesPanel shipmentId={shipmentId} userId={userId} />
      )}
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
  segments: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  segment: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8, backgroundColor: "#F0F0F0" },
  segmentActive: { backgroundColor: "#1B4332" },
  segmentText: { fontSize: 12, fontWeight: "600", color: "#7B8794" },
  segmentTextActive: { color: "#fff" },
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
  shareDisabled: { opacity: 0.6 },
  shareButtonText: { color: "#1B4332", fontSize: 12, fontWeight: "700" },
  liveIndicator: {
    marginTop: 8,
    color: "#40916C",
    fontSize: 12,
    fontWeight: "700",
  },
  statusGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statusChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#F8FAFB",
  },
  statusChipText: {
    color: "#2D3436",
    fontSize: 11,
    fontWeight: "600",
  },
});
