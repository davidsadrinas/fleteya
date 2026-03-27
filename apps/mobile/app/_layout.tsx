import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.replace("/auth/login");
      else router.replace("/(tabs)");
      setReady(true);
    };
    void init();

    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && event === "SIGNED_OUT") router.replace("/auth/login");
      if (session && event === "SIGNED_IN") router.replace("/(tabs)");
    });
    return () => authSub.subscription.unsubscribe();
  }, []);

  if (!ready) return null;

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
