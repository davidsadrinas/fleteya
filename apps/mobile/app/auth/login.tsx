import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const redirectTo = useMemo(
    () =>
      AuthSession.makeRedirectUri({
        scheme: "fletaya",
        path: "auth/callback",
      }),
    []
  );

  const onGoogleLogin = async () => {
    try {
      setLoadingGoogle(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No se pudo iniciar el flujo OAuth.");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success") return;
      if (result.url) {
        const parsed = Linking.parse(result.url);
        const code =
          typeof parsed.queryParams.code === "string" ? parsed.queryParams.code : undefined;
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (sessionData.session) router.replace("/(tabs)");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesión con Google.";
      Alert.alert("Error de login", message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const onEmailLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Email requerido", "Ingresá un email para recibir el magic link.");
      return;
    }

    try {
      setLoadingEmail(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      Alert.alert(
        "Revisá tu email",
        "Te enviamos un enlace para iniciar sesión en FleteYa."
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo enviar el magic link.";
      Alert.alert("Error", message);
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>FleteYa</Text>
          <Text style={styles.title}>Iniciar sesion</Text>
          <Text style={styles.subtitle}>Ingresa con Google o recibi un magic link por email.</Text>
        </View>

        <Pressable style={styles.googleButton} onPress={onGoogleLogin} disabled={loadingGoogle}>
          {loadingGoogle ? (
            <ActivityIndicator color="#1B4332" />
          ) : (
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          )}
        </Pressable>

        <View style={styles.dividerWrap}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.divider} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="tu@email.com"
          placeholderTextColor="#7B8794"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <Pressable style={styles.emailButton} onPress={onEmailLogin} disabled={loadingEmail}>
          {loadingEmail ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.emailButtonText}>Enviar magic link</Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  container: { flex: 1, paddingHorizontal: 20, justifyContent: "center" },
  header: { marginBottom: 28 },
  brand: { color: "#40916C", fontSize: 15, fontWeight: "700", marginBottom: 10 },
  title: { color: "#1B4332", fontSize: 28, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: "#5F6C72", fontSize: 14, lineHeight: 20 },
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  googleButtonText: { color: "#1B4332", fontWeight: "700", fontSize: 15 },
  dividerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 18,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#DFE6E9" },
  dividerText: { color: "#7B8794", fontSize: 12 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#2D3436",
    fontSize: 15,
  },
  emailButton: {
    marginTop: 12,
    backgroundColor: "#1B4332",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  emailButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
