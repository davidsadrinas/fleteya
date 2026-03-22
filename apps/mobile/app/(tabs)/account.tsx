import { View, Text } from "react-native";

export default function AccountScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#FDF6EC", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 36, marginBottom: 16 }}>◉</Text>
      <Text style={{ color: "#2D3436", fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Mi perfil</Text>
      <Text style={{ color: "#7B8794", fontSize: 13, textAlign: "center" }}>
        Perfil, documentación, vehículos, configuración y logout.
      </Text>
    </View>
  );
}
