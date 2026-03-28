import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import type { ShipmentStatus, ShipmentType } from "@shared/types";

type ShipmentRow = {
  id: string;
  status: ShipmentStatus;
  type: ShipmentType;
  final_price: number | null;
  created_at: string;
};

export default function TripsScreen() {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<ShipmentRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setTrips([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("shipments")
        .select("id,status,type,final_price,created_at")
        .eq("client_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      setTrips((data as ShipmentRow[] | null) ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  const grouped = useMemo(
    () => ({
      active: trips.filter((t) => t.status !== "delivered" && t.status !== "cancelled"),
      finished: trips.filter((t) => t.status === "delivered" || t.status === "cancelled"),
    }),
    [trips]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Mis viajes</Text>
        <Text style={styles.subtitle}>Historial de viajes completados, en curso y programados.</Text>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#40916C" />
          </View>
        ) : null}

        <Text style={styles.section}>Activos</Text>
        {grouped.active.length ? (
          grouped.active.map((trip) => (
            <Pressable
              key={trip.id}
              style={styles.card}
              onPress={() => router.push(`/tracking/${trip.id}`)}
            >
              <Text style={styles.cardTitle}>{trip.type.replaceAll("_", " ")}</Text>
              <Text style={styles.cardMeta}>
                {trip.status} · {new Date(trip.created_at).toLocaleString("es-AR")}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.empty}>Sin viajes activos.</Text>
        )}

        <Text style={styles.section}>Finalizados</Text>
        {grouped.finished.length ? (
          grouped.finished.map((trip) => (
            <View key={trip.id} style={styles.cardMuted}>
              <Text style={styles.cardTitle}>{trip.type.replaceAll("_", " ")}</Text>
              <Text style={styles.cardMeta}>
                {trip.status} · ${Number(trip.final_price ?? 0).toLocaleString("es-AR")}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>Sin viajes finalizados todavía.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  container: { padding: 18, gap: 8, paddingBottom: 24 },
  loader: { paddingVertical: 16 },
  title: { color: "#1B4332", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#5F6C72", fontSize: 13, marginBottom: 6 },
  section: { marginTop: 8, color: "#2D3436", fontWeight: "700", fontSize: 13 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    padding: 12,
  },
  cardMuted: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    padding: 12,
    opacity: 0.86,
  },
  cardTitle: { color: "#2D3436", fontWeight: "700", textTransform: "capitalize", marginBottom: 2 },
  cardMeta: { color: "#7B8794", fontSize: 12 },
  empty: { color: "#7B8794", fontSize: 12 },
});
