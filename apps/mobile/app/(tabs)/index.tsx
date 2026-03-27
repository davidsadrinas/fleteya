import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import type { Shipment } from "@shared/types";
import { supabase } from "@/lib/supabase";

type ShipmentRow = {
  id: string;
  status: Shipment["status"];
  final_price: number | null;
  type: Shipment["type"] | null;
  created_at: string;
  is_backhaul: boolean | null;
};

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [activeShipment, setActiveShipment] = useState<ShipmentRow | null>(null);
  const [backhaulOptions, setBackhaulOptions] = useState<ShipmentRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setLoading(false);
        router.replace("/auth/login");
        return;
      }

      const { data: shipments } = await supabase
        .from("shipments")
        .select("id,status,final_price,type,created_at,is_backhaul")
        .eq("client_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      const shipmentRows = ((shipments as ShipmentRow[] | null) ?? []).filter(Boolean);
      const active = shipmentRows.find(
        (item) => item.status !== "delivered" && item.status !== "cancelled"
      );
      setActiveShipment(active ?? null);
      setBackhaulOptions(shipmentRows.filter((item) => Boolean(item.is_backhaul)).slice(0, 4));
      setLoading(false);
    };

    void load();
  }, []);

  const activeLabel = useMemo(() => {
    if (!activeShipment) return "Todavia no tenes viajes activos";
    return `${activeShipment.type ?? "envio"} · ${activeShipment.status}`;
  }, [activeShipment]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FDF6EC" }}
      contentContainerStyle={{ padding: 20, paddingTop: 60 }}
    >
      {/* Header */}
      <Text style={{ fontSize: 22, fontWeight: "700", color: "#2D3436", marginBottom: 4 }}>
        Hola 👋
      </Text>
      <Text style={{ fontSize: 14, color: "#7B8794", marginBottom: 24 }}>
        ¿Qué necesitás mover hoy?
      </Text>

      {loading ? (
        <View style={{ marginVertical: 18 }}>
          <ActivityIndicator color="#40916C" />
        </View>
      ) : null}

      {/* New shipment CTA */}
      <TouchableOpacity
        onPress={() => router.push("/shipment/new")}
        style={{
          padding: 20,
          borderRadius: 16,
          marginBottom: 16,
          overflow: "hidden",
          backgroundColor: "#FF7F6B",
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(0,0,0,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
          Nuevo envío
        </Text>
        <Text style={{ fontSize: 17, fontWeight: "700", color: "#1B4332" }}>
          Cotizá y reservá tu flete
        </Text>
        <Text style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", marginTop: 4 }}>
          Mudanzas · Mercadería · Materiales
        </Text>
      </TouchableOpacity>

      {/* Active trip */}
      <TouchableOpacity
        onPress={() => {
          if (activeShipment?.id) {
            router.push(`/tracking/${activeShipment.id}`);
          }
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          padding: 16,
          borderRadius: 14,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "rgba(64,145,108,0.2)",
          marginBottom: 24,
        }}
      >
        <View style={{
          width: 42, height: 42, borderRadius: 12,
          backgroundColor: "rgba(64,145,108,0.1)",
          alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ fontSize: 20 }}>📍</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#2D3436", fontSize: 14, fontWeight: "600" }}>
            Viaje activo
          </Text>
          <Text style={{ color: "#B2BEC3", fontSize: 12, marginTop: 2 }}>
            {activeLabel}
          </Text>
        </View>
        <Text style={{ color: "#40916C", fontSize: 16 }}>→</Text>
      </TouchableOpacity>

      {/* Backhaul trips */}
      <Text style={{ fontSize: 15, fontWeight: "700", color: "#2D3436", marginBottom: 12 }}>
        🔄 Viajes de retorno
      </Text>
      <Text style={{ fontSize: 12, color: "#B2BEC3", marginBottom: 12 }}>
        Fleteros volviendo con espacio. Hasta 40% menos.
      </Text>

      {(backhaulOptions.length
        ? backhaulOptions.map((trip) => ({
            id: trip.id,
            from: "Origen",
            to: "Destino",
            price: Number(trip.final_price ?? 0).toLocaleString("es-AR"),
            time: new Date(trip.created_at).toLocaleString("es-AR"),
            space: "50%",
          }))
        : [
            {
              id: "sample-1",
              from: "Palermo",
              to: "Avellaneda",
              price: "8.500",
              time: "Hoy 16:00",
              space: "70%",
            },
          ]).map((trip) => (
        <View
          key={trip.id}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 14,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#DFE6E9",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: "#2D3436", fontWeight: "600", fontSize: 13 }}>{trip.from}</Text>
                <Text style={{ color: "#40916C", fontSize: 13 }}>→</Text>
                <Text style={{ color: "#2D3436", fontWeight: "600", fontSize: 13 }}>{trip.to}</Text>
              </View>
            </View>
            <View style={{
              paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
              backgroundColor: "rgba(64,145,108,0.1)", borderWidth: 1, borderColor: "rgba(64,145,108,0.2)",
            }}>
              <Text style={{ color: "#40916C", fontSize: 10, fontWeight: "700" }}>
                -{100 - parseInt(trip.space)}% dto
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "#7B8794", fontSize: 11 }}>
              🕐 {trip.time} · 📦 {trip.space} libre
            </Text>
            <Text style={{ color: "#40916C", fontWeight: "700", fontSize: 15 }}>
              ${trip.price}
            </Text>
          </View>
        </View>
      ))}

      {/* How it works */}
      <Text style={{ fontSize: 15, fontWeight: "700", color: "#2D3436", marginTop: 16, marginBottom: 12 }}>
        📊 ¿Cómo funciona?
      </Text>
      {[
        { s: "1", t: "Cargá tu envío", d: "Qué movés, dimensiones, peso" },
        { s: "2", t: "Elegí tu flete", d: "Compará precios y reseñas" },
        { s: "3", t: "Ahorrá con retornos", d: "Fleteros que vuelven = hasta 40% menos" },
      ].map((item) => (
        <View key={item.s} style={{ flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
          <View style={{
            width: 30, height: 30, borderRadius: 10,
            backgroundColor: "rgba(64,145,108,0.1)", borderWidth: 1, borderColor: "rgba(64,145,108,0.2)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ color: "#40916C", fontWeight: "700", fontSize: 13 }}>{item.s}</Text>
          </View>
          <View>
            <Text style={{ color: "#2D3436", fontWeight: "600", fontSize: 13, marginBottom: 1 }}>{item.t}</Text>
            <Text style={{ color: "#B2BEC3", fontSize: 11 }}>{item.d}</Text>
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
