import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { VEHICLE_TYPES, type VehicleType } from "@shared/types";
import { supabase } from "@/lib/supabase";

type VehicleRow = {
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  plate: string;
  capacity: string;
  active: boolean;
};

type FormState = {
  type: VehicleType;
  brand: string;
  model: string;
  year: string;
  plate: string;
  capacity: string;
};

const initialForm: FormState = {
  type: "utilitario",
  brand: "",
  model: "",
  year: "",
  plate: "",
  capacity: "",
};

export default function VehiclesScreen() {
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);

  const loadVehicles = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data: driver } = await supabase.from("drivers").select("id").eq("user_id", userId).maybeSingle();
    const currentDriverId = (driver as { id: string } | null)?.id ?? null;
    setDriverId(currentDriverId);
    if (!currentDriverId) {
      setLoading(false);
      return;
    }

    const { data: rows } = await supabase
      .from("vehicles")
      .select("id,type,brand,model,year,plate,capacity,active")
      .eq("driver_id", currentDriverId)
      .order("created_at", { ascending: false });
    setVehicles((rows as VehicleRow[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadVehicles();
  }, []);

  const vehicleTypeOptions = useMemo(() => Object.keys(VEHICLE_TYPES) as VehicleType[], []);

  const addVehicle = async () => {
    if (!driverId) {
      Alert.alert("Perfil incompleto", "Primero completa la verificacion de fletero.");
      return;
    }
    if (!form.brand || !form.model || !form.plate) {
      Alert.alert("Campos requeridos", "Completá marca, modelo y patente.");
      return;
    }

    const payload = {
      driver_id: driverId,
      type: form.type,
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: Number(form.year || "0"),
      plate: form.plate.trim().toUpperCase(),
      capacity: form.capacity.trim() || VEHICLE_TYPES[form.type].capacity,
      active: true,
    };

    const { error } = await supabase.from("vehicles").insert(payload);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    setForm(initialForm);
    await loadVehicles();
  };

  const toggleActive = async (vehicleId: string, active: boolean) => {
    const { error } = await supabase.from("vehicles").update({ active: !active }).eq("id", vehicleId);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    await loadVehicles();
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
      <FlatList
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Mis vehiculos</Text>
            <Text style={styles.subtitle}>Alta y gestion de flota del fletero.</Text>

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.rowWrap}>
              {vehicleTypeOptions.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setForm((prev) => ({ ...prev, type: option }))}
                  style={[styles.chip, form.type === option ? styles.chipSelected : undefined]}
                >
                  <Text style={[styles.chipText, form.type === option ? styles.chipTextSelected : undefined]}>
                    {VEHICLE_TYPES[option].label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Marca"
              value={form.brand}
              onChangeText={(value) => setForm((prev) => ({ ...prev, brand: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Modelo"
              value={form.model}
              onChangeText={(value) => setForm((prev) => ({ ...prev, model: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Anio"
              keyboardType="number-pad"
              value={form.year}
              onChangeText={(value) => setForm((prev) => ({ ...prev, year: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Patente"
              value={form.plate}
              onChangeText={(value) => setForm((prev) => ({ ...prev, plate: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Capacidad"
              value={form.capacity}
              onChangeText={(value) => setForm((prev) => ({ ...prev, capacity: value }))}
            />

            <Pressable style={styles.cta} onPress={() => void addVehicle()}>
              <Text style={styles.ctaText}>Agregar vehiculo</Text>
            </Pressable>

            <Text style={styles.section}>Vehiculos cargados</Text>
          </View>
        }
        data={vehicles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.brand} {item.model} ({item.plate})
            </Text>
            <Text style={styles.cardSub}>
              {VEHICLE_TYPES[item.type].label} · {item.capacity} · {item.year}
            </Text>
            <Pressable style={styles.cardAction} onPress={() => void toggleActive(item.id, item.active)}>
              <Text style={styles.cardActionText}>{item.active ? "Desactivar" : "Activar"}</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Todavia no cargaste vehiculos.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, paddingBottom: 30 },
  header: { gap: 8, marginBottom: 10 },
  title: { color: "#1B4332", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#5F6C72", marginBottom: 6 },
  label: { color: "#2D3436", fontWeight: "700", fontSize: 13 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
  },
  chipSelected: { backgroundColor: "#1B4332", borderColor: "#1B4332" },
  chipText: { color: "#2D3436", fontSize: 11, fontWeight: "700" },
  chipTextSelected: { color: "#FFFFFF" },
  input: {
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
    color: "#2D3436",
  },
  cta: {
    marginTop: 6,
    borderRadius: 12,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B4332",
  },
  ctaText: { color: "#FFFFFF", fontWeight: "700" },
  section: { marginTop: 10, color: "#2D3436", fontWeight: "700" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    padding: 14,
    marginBottom: 8,
  },
  cardTitle: { color: "#2D3436", fontWeight: "700", marginBottom: 3 },
  cardSub: { color: "#7B8794", fontSize: 12, marginBottom: 8 },
  cardAction: {
    alignSelf: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cardActionText: { color: "#1B4332", fontWeight: "700", fontSize: 12 },
  empty: { paddingVertical: 24, alignItems: "center" },
  emptyText: { color: "#7B8794" },
});
