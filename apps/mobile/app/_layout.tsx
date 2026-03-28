import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

type DriverLocationBlockReason = "services_off" | "permission_denied" | null;

function DriverLocationBlockedScreen({
  reason,
  onRetry,
}: {
  reason: Exclude<DriverLocationBlockReason, null>;
  onRetry: () => void;
}) {
  const title =
    reason === "services_off" ? "Activá la ubicación del dispositivo" : "Otorgá permisos de ubicación";
  const detail =
    reason === "services_off"
      ? "Como fletero, la localización activa es obligatoria para usar la app."
      : "Como fletero, tenés que permitir ubicación en primer y segundo plano para continuar.";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blockContainer}>
        <Text style={styles.blockTitle}>{title}</Text>
        <Text style={styles.blockText}>{detail}</Text>
        <Pressable style={styles.blockPrimary} onPress={onRetry}>
          <Text style={styles.blockPrimaryText}>Reintentar permisos</Text>
        </Pressable>
        <Pressable style={styles.blockGhost} onPress={() => void Linking.openSettings()}>
          <Text style={styles.blockGhostText}>Abrir configuración</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [isDriver, setIsDriver] = useState(false);
  const [locationBlockedReason, setLocationBlockedReason] = useState<DriverLocationBlockReason>(null);

  const validateDriverLocationRequirements = async () => {
    setCheckingLocation(true);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationBlockedReason("services_off");
        return;
      }

      let foreground = await Location.getForegroundPermissionsAsync();
      if (foreground.status !== "granted") {
        foreground = await Location.requestForegroundPermissionsAsync();
      }
      if (foreground.status !== "granted") {
        setLocationBlockedReason("permission_denied");
        return;
      }

      let background = await Location.getBackgroundPermissionsAsync();
      if (background.status !== "granted") {
        background = await Location.requestBackgroundPermissionsAsync();
      }
      if (background.status !== "granted") {
        setLocationBlockedReason("permission_denied");
        return;
      }

      setLocationBlockedReason(null);
    } finally {
      setCheckingLocation(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.replace("/auth/login");
      else {
        const { data: driver } = await supabase
          .from("drivers")
          .select("id")
          .eq("user_id", data.session.user.id)
          .maybeSingle();
        const isCurrentUserDriver = Boolean((driver as { id?: string } | null)?.id);
        setIsDriver(isCurrentUserDriver);
        if (isCurrentUserDriver) {
          await validateDriverLocationRequirements();
        } else {
          setLocationBlockedReason(null);
        }
        router.replace("/(tabs)");
      }
      setReady(true);
    };
    void init();

    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && event === "SIGNED_OUT") router.replace("/auth/login");
      if (session && event === "SIGNED_IN") {
        void (async () => {
          const { data: driver } = await supabase
            .from("drivers")
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();
          const isCurrentUserDriver = Boolean((driver as { id?: string } | null)?.id);
          setIsDriver(isCurrentUserDriver);
          if (isCurrentUserDriver) {
            await validateDriverLocationRequirements();
          } else {
            setLocationBlockedReason(null);
          }
          router.replace("/(tabs)");
        })();
      }
    });

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active" && isDriver) {
        void validateDriverLocationRequirements();
      }
    });

    return () => {
      authSub.subscription.unsubscribe();
      appStateSub.remove();
    };
  }, [isDriver]);

  if (!ready || checkingLocation) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#40916C" />
        </View>
      </SafeAreaView>
    );
  }

  if (isDriver && locationBlockedReason) {
    return (
      <DriverLocationBlockedScreen
        reason={locationBlockedReason}
        onRetry={() => {
          void validateDriverLocationRequirements();
        }}
      />
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FDF6EC" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" options={{ animation: "fade" }} />
        <Stack.Screen name="shipment" options={{ presentation: "modal" }} />
        <Stack.Screen name="tracking" />
        <Stack.Screen name="profile" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  blockContainer: { flex: 1, padding: 22, justifyContent: "center", gap: 12 },
  blockTitle: { color: "#1B4332", fontSize: 24, fontWeight: "800", textAlign: "center" },
  blockText: { color: "#5F6C72", fontSize: 14, lineHeight: 20, textAlign: "center" },
  blockPrimary: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#1B4332",
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  blockPrimaryText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  blockGhost: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  blockGhostText: { color: "#2D3436", fontWeight: "600", fontSize: 14 },
});
