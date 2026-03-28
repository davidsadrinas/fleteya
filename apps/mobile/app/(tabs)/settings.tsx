import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";

export default function SettingsScreen() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Cerrar sesión", "¿Seguro que querés salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          await supabase.auth.signOut();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Configuración</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apariencia</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Tema</Text>
          <Text style={styles.rowValue}>Oscuro</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <Pressable style={styles.row} onPress={() => router.push("/profile/vehicles")}>
          <Text style={styles.rowLabel}>Mis vehículos</Text>
          <Text style={styles.chevron}>→</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL("https://fletaya.com.ar/legal/terminos")}
        >
          <Text style={styles.rowLabel}>Términos y condiciones</Text>
          <Text style={styles.chevron}>→</Text>
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL("https://fletaya.com.ar/legal/privacidad")}
        >
          <Text style={styles.rowLabel}>Política de privacidad</Text>
          <Text style={styles.chevron}>→</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Soporte</Text>
        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL("mailto:soporte@fletaya.com.ar")}
        >
          <Text style={styles.rowLabel}>Contactar soporte</Text>
          <Text style={styles.chevron}>→</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.logoutBtn, loggingOut && styles.disabled]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        <Text style={styles.logoutText}>
          {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </Text>
      </Pressable>

      <Text style={styles.version}>
        FleteYa v{Constants.expoConfig?.version ?? "1.0.0"}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1B4332" },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { color: "#40916C", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(45,52,54,0.4)", padding: 14, borderRadius: 10, marginBottom: 4 },
  rowLabel: { color: "#DFE6E9", fontSize: 15 },
  rowValue: { color: "#B2BEC3", fontSize: 14 },
  chevron: { color: "#B2BEC3", fontSize: 16 },
  logoutBtn: { backgroundColor: "#E74C3C", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 16 },
  disabled: { opacity: 0.5 },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  version: { color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 16, fontSize: 12 },
});
