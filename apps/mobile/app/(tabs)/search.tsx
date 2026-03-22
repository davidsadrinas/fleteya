import { View, Text } from "react-native";

export default function SearchScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#FDF6EC", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 36, marginBottom: 16 }}>◎</Text>
      <Text style={{ color: "#2D3436", fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Nuevo envío</Text>
      <Text style={{ color: "#7B8794", fontSize: 13, textAlign: "center" }}>
        Wizard de nuevo envío con autocomplete de Google Places, mapa interactivo, y selección de fletero.
      </Text>
    </View>
  );
}
