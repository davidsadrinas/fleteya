import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import type { ShipmentType } from "@shared/types";
import { SHIPMENT_TYPES } from "@shared/constants";

const SHIPMENT_TYPE_IDS: ShipmentType[] = SHIPMENT_TYPES.map((item) => item.id);

export default function SearchScreen() {
  const [type, setType] = useState<ShipmentType>("mudanza");
  const [helpers, setHelpers] = useState("0");
  const [description, setDescription] = useState("");

  const goToFullWizard = () => {
    if (!description.trim()) {
      Alert.alert("Completa una descripcion", "Contanos que necesitas trasladar.");
      return;
    }

    router.push({
      pathname: "/shipment/new",
      params: {
        type,
        helpers,
        description,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nuevo envio</Text>
        <Text style={styles.subtitle}>Completa lo basico y continua al wizard completo.</Text>

        <Text style={styles.label}>Tipo de envio</Text>
        <View style={styles.chipsWrap}>
          {SHIPMENT_TYPE_IDS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setType(item)}
              style={[styles.chip, item === type ? styles.chipSelected : undefined]}
            >
              <Text style={[styles.chipText, item === type ? styles.chipTextSelected : undefined]}>
                {item.replaceAll("_", " ")}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Ayudantes</Text>
        <TextInput
          keyboardType="number-pad"
          value={helpers}
          onChangeText={setHelpers}
          style={styles.input}
          placeholder="0"
          placeholderTextColor="#8A959A"
        />

        <Text style={styles.label}>Descripcion de carga</Text>
        <TextInput
          multiline
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          placeholder="Ej: heladera + lavarropas + cajas medianas"
          placeholderTextColor="#8A959A"
        />

        <Pressable style={styles.cta} onPress={goToFullWizard}>
          <Text style={styles.ctaText}>Continuar al wizard completo</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  container: { padding: 18, paddingTop: 22, gap: 10 },
  title: { color: "#1B4332", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#5F6C72", fontSize: 14, marginBottom: 8 },
  label: { color: "#2D3436", fontWeight: "700", fontSize: 13, marginTop: 6 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  chipSelected: { backgroundColor: "#1B4332", borderColor: "#1B4332" },
  chipText: { color: "#2D3436", textTransform: "capitalize", fontSize: 12, fontWeight: "600" },
  chipTextSelected: { color: "#FFFFFF" },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#2D3436",
    fontSize: 14,
  },
  textArea: { minHeight: 96, textAlignVertical: "top" },
  cta: {
    marginTop: 8,
    backgroundColor: "#FF7F6B",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  ctaText: { color: "#1B4332", fontWeight: "800", fontSize: 14 },
});
