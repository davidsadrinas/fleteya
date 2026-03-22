import { View, Text } from "react-native";

export default function TripsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#FDF6EC", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 36, marginBottom: 16 }}>↹</Text>
      <Text style={{ color: "#2D3436", fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Mis viajes</Text>
      <Text style={{ color: "#7B8794", fontSize: 13, textAlign: "center" }}>
        Historial de viajes completados, en curso y programados.
      </Text>
    </View>
  );
}
