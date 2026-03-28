import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  sender_user_id: string;
  body: string;
  quick_tag: string | null;
  created_at: string;
};

const QUICK_REPLIES = [
  "Estoy en camino",
  "Ya llegué",
  "Esperame 5 min",
  "OK, listo",
];

export default function ChatPanel({
  shipmentId,
  userId,
}: {
  shipmentId: string;
  userId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("shipment_chat_messages")
        .select("*")
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat:${shipmentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shipment_chat_messages",
          filter: `shipment_id=eq.${shipmentId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const send = async (body: string) => {
    if (!body.trim() || sending) return;
    setSending(true);
    const { error } = await supabase.from("shipment_chat_messages").insert({
      shipment_id: shipmentId,
      sender_user_id: userId,
      body: body.trim(),
    });
    if (error) {
      Alert.alert("Error", "No se pudo enviar el mensaje. Intentá de nuevo.");
    } else {
      setText("");
    }
    setSending(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent}>
        {messages.map((m) => {
          const isOwn = m.sender_user_id === userId;
          return (
            <View key={m.id} style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
              <Text style={[styles.bubbleText, isOwn ? styles.ownText : styles.otherText]}>
                {m.body}
              </Text>
              <Text style={styles.time}>
                {new Date(m.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          );
        })}
        {messages.length === 0 && (
          <Text style={styles.emptyText}>No hay mensajes aún</Text>
        )}
      </ScrollView>

      <View style={styles.quickReplies}>
        {QUICK_REPLIES.map((qr) => (
          <Pressable key={qr} style={styles.quickBtn} onPress={() => send(qr)}>
            <Text style={styles.quickText}>{qr}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Escribí un mensaje..."
          placeholderTextColor="#B2BEC3"
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={() => send(text)}
        />
        <Pressable
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendDisabled]}
          onPress={() => send(text)}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendText}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1B4332" },
  messages: { flex: 1 },
  messagesContent: { padding: 12, paddingBottom: 4 },
  bubble: { maxWidth: "80%", padding: 10, borderRadius: 12, marginBottom: 8 },
  ownBubble: { alignSelf: "flex-end", backgroundColor: "#40916C" },
  otherBubble: { alignSelf: "flex-start", backgroundColor: "#2D3436" },
  bubbleText: { fontSize: 14 },
  ownText: { color: "#fff" },
  otherText: { color: "#DFE6E9" },
  time: { fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4, alignSelf: "flex-end" },
  emptyText: { color: "#B2BEC3", textAlign: "center", marginTop: 40, fontSize: 14 },
  quickReplies: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 6, paddingBottom: 8 },
  quickBtn: { backgroundColor: "rgba(64,145,108,0.3)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  quickText: { color: "#40916C", fontSize: 12, fontWeight: "600" },
  inputRow: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: "#2D3436", gap: 8 },
  input: { flex: 1, backgroundColor: "#2D3436", color: "#fff", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 },
  sendBtn: { backgroundColor: "#FF7F6B", borderRadius: 20, paddingHorizontal: 16, justifyContent: "center" },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
