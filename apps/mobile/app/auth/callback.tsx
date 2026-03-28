import { useEffect } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackScreen() {
  useEffect(() => {
    const complete = async () => {
      try {
        const initial = await Linking.getInitialURL();
        if (initial) {
          const parsed = Linking.parse(initial);
          const code =
            typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : undefined;
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
        }
      } catch {
        // Ignore callback parsing failures and rely on current session state.
      } finally {
        const { data } = await supabase.auth.getSession();
        if (data.session) router.replace("/(tabs)");
        else router.replace("/auth/login");
      }
    };
    void complete();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <ActivityIndicator color="#40916C" />
        <Text style={styles.text}>Completando ingreso...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  text: { color: "#5F6C72", fontSize: 13 },
});
