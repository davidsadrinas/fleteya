import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";

type Dispute = {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  resolution_note: string | null;
  created_at: string;
};

const REASONS = [
  "Daño en la carga",
  "Demora excesiva",
  "Cobro indebido",
  "Conductor inadecuado",
  "No se presentó",
  "Otro",
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "Abierta", color: "#F87171" },
  under_review: { label: "En revisión", color: "#FBBF24" },
  resolved: { label: "Resuelta", color: "#34D399" },
  rejected: { label: "Rechazada", color: "#B2BEC3" },
};

export default function DisputesPanel({
  shipmentId,
  userId,
}: {
  shipmentId: string;
  userId: string;
}) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDisputes = async () => {
      const { data } = await supabase
        .from("shipment_disputes")
        .select("*")
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: false });
      if (data) setDisputes(data);
    };
    fetchDisputes();

    // Realtime: listen for new disputes and status updates
    const channel = supabase
      .channel(`disputes:${shipmentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shipment_disputes",
          filter: `shipment_id=eq.${shipmentId}`,
        },
        (payload) => {
          setDisputes((prev) => [payload.new as Dispute, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shipment_disputes",
          filter: `shipment_id=eq.${shipmentId}`,
        },
        (payload) => {
          const updated = payload.new as Dispute;
          setDisputes((prev) =>
            prev.map((d) => (d.id === updated.id ? updated : d))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId]);

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert("Error", "Seleccioná un motivo");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("shipment_disputes")
      .insert({
        shipment_id: shipmentId,
        reported_by: userId,
        reason,
        description: description || null,
      })
      .select("*")
      .single();

    if (error) {
      Alert.alert("Error", "No se pudo crear la disputa");
    } else if (data) {
      setDisputes((prev) => [data, ...prev]);
      setShowForm(false);
      setReason("");
      setDescription("");
    }
    setSubmitting(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Disputas</Text>

      {!showForm && (
        <Pressable style={styles.newBtn} onPress={() => setShowForm(true)}>
          <Text style={styles.newBtnText}>+ Reportar problema</Text>
        </Pressable>
      )}

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.label}>Motivo</Text>
          <View style={styles.reasons}>
            {REASONS.map((r) => (
              <Pressable
                key={r}
                style={[styles.reasonBtn, reason === r && styles.reasonActive]}
                onPress={() => setReason(r)}
              >
                <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Detallá el problema..."
            placeholderTextColor="#B2BEC3"
            multiline
            maxLength={1000}
          />

          <View style={styles.formActions}>
            <Pressable
              style={[styles.submitBtn, submitting && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitText}>
                {submitting ? "Enviando..." : "Enviar disputa"}
              </Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      )}

      {disputes.map((d) => {
        const meta = STATUS_LABELS[d.status] ?? STATUS_LABELS.open;
        return (
          <View key={d.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardReason}>{d.reason}</Text>
              <Text style={[styles.badge, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {d.description && <Text style={styles.cardDesc}>{d.description}</Text>}
            {d.resolution_note && (
              <Text style={styles.resolution}>Resolución: {d.resolution_note}</Text>
            )}
            <Text style={styles.date}>
              {new Date(d.created_at).toLocaleDateString("es-AR")}
            </Text>
          </View>
        );
      })}

      {disputes.length === 0 && !showForm && (
        <Text style={styles.empty}>No hay disputas para este envío</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1B4332" },
  content: { padding: 16 },
  title: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  newBtn: { backgroundColor: "#FF7F6B", padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  newBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  form: { backgroundColor: "rgba(45,52,54,0.6)", padding: 16, borderRadius: 12, marginBottom: 16 },
  label: { color: "#B2BEC3", fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 8 },
  reasons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reasonBtn: { backgroundColor: "#2D3436", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#2D3436" },
  reasonActive: { borderColor: "#FF7F6B", backgroundColor: "rgba(255,127,107,0.15)" },
  reasonText: { color: "#B2BEC3", fontSize: 12 },
  reasonTextActive: { color: "#FF7F6B" },
  input: { backgroundColor: "#2D3436", color: "#fff", borderRadius: 8, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: "top", marginTop: 4 },
  formActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  submitBtn: { flex: 1, backgroundColor: "#FF7F6B", padding: 12, borderRadius: 8, alignItems: "center" },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cancelBtn: { flex: 1, backgroundColor: "#2D3436", padding: 12, borderRadius: 8, alignItems: "center" },
  cancelText: { color: "#B2BEC3", fontWeight: "600", fontSize: 14 },
  card: { backgroundColor: "rgba(45,52,54,0.4)", padding: 12, borderRadius: 10, marginBottom: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardReason: { color: "#fff", fontWeight: "600", fontSize: 14, flex: 1 },
  badge: { fontSize: 11, fontWeight: "700" },
  cardDesc: { color: "#B2BEC3", fontSize: 13, marginTop: 4 },
  resolution: { color: "#FBBF24", fontSize: 12, marginTop: 6, fontStyle: "italic" },
  date: { color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 6 },
  empty: { color: "#B2BEC3", textAlign: "center", marginTop: 40, fontSize: 14 },
});
