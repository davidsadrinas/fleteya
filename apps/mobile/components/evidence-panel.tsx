import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";

type Evidence = {
  id: string;
  stage: string;
  file_url: string;
  note: string | null;
  created_at: string;
};

export default function EvidencePanel({
  shipmentId,
  userId,
  stage = "pickup",
}: {
  shipmentId: string;
  userId: string;
  stage?: "pickup" | "delivery";
}) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("shipment_evidence")
        .select("*")
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: false });
      if (data) setEvidence(data);
    };
    fetch();
  }, [shipmentId]);

  const upload = async (source: "camera" | "gallery") => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: "images" as ImagePicker.MediaType,
      quality: 0.7,
      allowsEditing: false,
    };

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);

    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() || "jpg";
      const path = `${shipmentId}/${Date.now()}.${ext}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadErr } = await supabase.storage
        .from("shipment-evidence")
        .upload(path, blob, { contentType: `image/${ext}` });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("shipment-evidence")
        .getPublicUrl(path);

      const { data: record, error: insertErr } = await supabase
        .from("shipment_evidence")
        .insert({
          shipment_id: shipmentId,
          uploaded_by: userId,
          stage,
          file_url: urlData.publicUrl,
        })
        .select("*")
        .single();

      if (insertErr) throw insertErr;
      if (record) setEvidence((prev) => [record, ...prev]);
    } catch (err) {
      Alert.alert("Error", "No se pudo subir la foto");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Evidencia — {stage === "pickup" ? "Retiro" : "Entrega"}
      </Text>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.btn, uploading && styles.btnDisabled]}
          onPress={() => upload("camera")}
          disabled={uploading}
        >
          <Text style={styles.btnText}>📷 Cámara</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, uploading && styles.btnDisabled]}
          onPress={() => upload("gallery")}
          disabled={uploading}
        >
          <Text style={styles.btnText}>🖼️ Galería</Text>
        </Pressable>
      </View>

      {uploading && <Text style={styles.uploading}>Subiendo...</Text>}

      <ScrollView horizontal style={styles.gallery} showsHorizontalScrollIndicator={false}>
        {evidence
          .filter((e) => e.stage === stage)
          .map((e) => (
            <Image key={e.id} source={{ uri: e.file_url }} style={styles.thumb} />
          ))}
        {evidence.filter((e) => e.stage === stage).length === 0 && (
          <Text style={styles.empty}>Sin evidencia aún</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#1B4332" },
  title: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  buttons: { flexDirection: "row", gap: 12, marginBottom: 12 },
  btn: { flex: 1, backgroundColor: "#40916C", padding: 12, borderRadius: 12, alignItems: "center" },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  uploading: { color: "#FBBF24", fontSize: 12, textAlign: "center", marginBottom: 8 },
  gallery: { marginTop: 8 },
  thumb: { width: 100, height: 100, borderRadius: 8, marginRight: 8, backgroundColor: "#2D3436" },
  empty: { color: "#B2BEC3", fontSize: 14, alignSelf: "center", marginTop: 20 },
});
