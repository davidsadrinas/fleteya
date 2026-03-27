import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { registerForPushNotificationsAsync } from "@/lib/push-notifications";

type DriverProfile = {
  id: string;
  verified: boolean;
  dni_front_url: string | null;
  license_url: string | null;
  insurance_url: string | null;
  vtv_url: string | null;
};

export default function AccountScreen() {
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);

  const loadProfile = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData.session?.user.id ?? null;
    setUserId(currentUserId);
    if (!currentUserId) {
      setLoading(false);
      router.replace("/auth/login");
      return;
    }

    const { data } = await supabase
      .from("drivers")
      .select("id,verified,dni_front_url,license_url,insurance_url,vtv_url")
      .eq("user_id", currentUserId)
      .maybeSingle();
    setDriver((data as DriverProfile | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    void loadProfile();
    registerForPushNotificationsAsync()
      .then((token) => setPushToken(token))
      .catch(() => setPushToken(null));
  }, []);

  const uploadDocument = async (
    field: "dni_front_url" | "license_url" | "insurance_url" | "vtv_url"
  ) => {
    if (!userId) return;
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a camara para subir documentos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]?.uri) return;

    const asset = result.assets[0];
    const ext = asset.uri.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${userId}/${field}-${Date.now()}.${ext}`;
    const response = await fetch(asset.uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from("dni-documents")
      .upload(filePath, blob, { upsert: true, contentType: asset.mimeType ?? "image/jpeg" });
    if (uploadError) {
      Alert.alert("Error", uploadError.message);
      return;
    }

    const publicUrl = supabase.storage.from("dni-documents").getPublicUrl(filePath).data.publicUrl;
    const payload = driver?.id
      ? { [field]: publicUrl }
      : { user_id: userId, [field]: publicUrl };

    if (driver?.id) {
      const { error } = await supabase.from("drivers").update(payload).eq("id", driver.id);
      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("drivers").insert(payload);
      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
    }

    Alert.alert("Listo", "Documento actualizado.");
    await loadProfile();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

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
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Mi perfil</Text>
        <Text style={styles.subtitle}>
          Estado de verificacion: {driver?.verified ? "Verificado" : "Pendiente"}
        </Text>
        <Text style={styles.micro}>
          Push: {pushToken ? "Activo" : "No configurado en este dispositivo"}
        </Text>

        <Pressable style={styles.card} onPress={() => void uploadDocument("dni_front_url")}>
          <Text style={styles.cardTitle}>Subir DNI</Text>
          <Text style={styles.cardText}>
            {driver?.dni_front_url ? "Actualizado" : "Pendiente"}
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => void uploadDocument("license_url")}>
          <Text style={styles.cardTitle}>Subir licencia</Text>
          <Text style={styles.cardText}>{driver?.license_url ? "Actualizado" : "Pendiente"}</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => void uploadDocument("insurance_url")}>
          <Text style={styles.cardTitle}>Subir seguro</Text>
          <Text style={styles.cardText}>
            {driver?.insurance_url ? "Actualizado" : "Pendiente"}
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => void uploadDocument("vtv_url")}>
          <Text style={styles.cardTitle}>Subir VTV</Text>
          <Text style={styles.cardText}>{driver?.vtv_url ? "Actualizado" : "Pendiente"}</Text>
        </Pressable>

        <Pressable style={styles.primary} onPress={() => router.push("/profile/vehicles")}>
          <Text style={styles.primaryText}>Gestionar vehiculos</Text>
        </Pressable>

        <Pressable style={styles.ghost} onPress={() => void logout()}>
          <Text style={styles.ghostText}>Cerrar sesion</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 18, gap: 10 },
  title: { color: "#1B4332", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#5F6C72", marginBottom: 6 },
  micro: { color: "#7B8794", fontSize: 12, marginBottom: 6 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    padding: 14,
  },
  cardTitle: { color: "#2D3436", fontWeight: "700", fontSize: 14, marginBottom: 2 },
  cardText: { color: "#7B8794", fontSize: 12 },
  primary: {
    marginTop: 8,
    backgroundColor: "#1B4332",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryText: { color: "#FFFFFF", fontWeight: "700" },
  ghost: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  ghostText: { color: "#2D3436", fontWeight: "600" },
});
