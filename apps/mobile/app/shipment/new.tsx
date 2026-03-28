import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams, router } from "expo-router";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import type { ShipmentType } from "@shared/types";
import { supabase } from "@/lib/supabase";

type PlaceSelection = {
  address: string;
  lat: number;
  lng: number;
};

const DEFAULT_REGION = {
  latitude: -34.6037,
  longitude: -58.3816,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

function asShipmentType(value: string | undefined): ShipmentType {
  const allowed: ShipmentType[] = [
    "mudanza",
    "mercaderia",
    "materiales",
    "electrodomesticos",
    "muebles",
    "acarreo_vehiculo",
    "limpieza_atmosferico",
    "residuos",
  ];
  if (value && allowed.includes(value as ShipmentType)) return value as ShipmentType;
  return "mudanza";
}

export default function ShipmentWizardScreen() {
  const params = useLocalSearchParams<{
    type?: string;
    helpers?: string;
    description?: string;
  }>();
  const googleApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ??
    "";

  const [type] = useState<ShipmentType>(asShipmentType(params.type));
  const [helpers, setHelpers] = useState(params.helpers ?? "0");
  const [description, setDescription] = useState(params.description ?? "");
  const [origin, setOrigin] = useState<PlaceSelection | null>(null);
  const [destination, setDestination] = useState<PlaceSelection | null>(null);
  const [loading, setLoading] = useState(false);

  const mapRegion = useMemo(() => {
    if (origin) {
      return {
        latitude: origin.lat,
        longitude: origin.lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    return DEFAULT_REGION;
  }, [origin]);

  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

  const saveShipment = async () => {
    if (!origin || !destination) {
      Alert.alert("Faltan direcciones", "Completa origen y destino.");
      return;
    }

    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session?.user.id) {
        router.replace("/auth/login");
        return;
      }

      // Call web API to create shipment with proper pricing
      const res = await fetch(`${apiUrl}/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type,
          description: description || undefined,
          helpers: Number(helpers) || 0,
          legs: [
            {
              originAddress: origin.address,
              originLat: origin.lat,
              originLng: origin.lng,
              destAddress: destination.address,
              destLat: destination.lat,
              destLng: destination.lng,
            },
          ],
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo crear el envío");

      const shipmentId = json.shipment?.id;
      if (!shipmentId) throw new Error("No se recibió ID del envío");

      router.replace(`/tracking/${shipmentId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear el envío.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Wizard de envio</Text>
        <Text style={styles.subtitle}>Carga direcciones y confirma tu solicitud.</Text>

        <Text style={styles.label}>Tipo seleccionado</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{type.replaceAll("_", " ")}</Text>
        </View>

        <Text style={styles.label}>Origen</Text>
        {googleApiKey ? (
          <GooglePlacesAutocomplete
            placeholder="Buscar origen"
            fetchDetails
            query={{ key: googleApiKey, language: "es", components: "country:ar" }}
            styles={placesStyles}
            onPress={(data, details) => {
              if (!details?.geometry.location) return;
              setOrigin({
                address: data.description,
                lat: details.geometry.location.lat,
                lng: details.geometry.location.lng,
              });
            }}
          />
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Direccion de origen"
            value={origin?.address ?? ""}
            onChangeText={(value) =>
              setOrigin({ address: value, lat: DEFAULT_REGION.latitude, lng: DEFAULT_REGION.longitude })
            }
          />
        )}

        <Text style={styles.label}>Destino</Text>
        {googleApiKey ? (
          <GooglePlacesAutocomplete
            placeholder="Buscar destino"
            fetchDetails
            query={{ key: googleApiKey, language: "es", components: "country:ar" }}
            styles={placesStyles}
            onPress={(data, details) => {
              if (!details?.geometry.location) return;
              setDestination({
                address: data.description,
                lat: details.geometry.location.lat,
                lng: details.geometry.location.lng,
              });
            }}
          />
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Direccion de destino"
            value={destination?.address ?? ""}
            onChangeText={(value) =>
              setDestination({
                address: value,
                lat: DEFAULT_REGION.latitude,
                lng: DEFAULT_REGION.longitude,
              })
            }
          />
        )}

        <Text style={styles.label}>Ayudantes</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={helpers}
          onChangeText={setHelpers}
        />

        <Text style={styles.label}>Descripcion</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <MapView style={styles.map} initialRegion={mapRegion} region={mapRegion}>
          {origin ? <Marker coordinate={{ latitude: origin.lat, longitude: origin.lng }} title="Origen" /> : null}
          {destination ? (
            <Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }} title="Destino" pinColor="#FF7F6B" />
          ) : null}
        </MapView>

        <Pressable style={styles.cta} onPress={() => void saveShipment()} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaText}>Crear envio y buscar fletero</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  container: { padding: 16, gap: 8, paddingBottom: 30 },
  title: { color: "#1B4332", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#5F6C72", marginBottom: 6 },
  label: { color: "#2D3436", fontSize: 13, fontWeight: "700", marginTop: 6 },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 11,
    backgroundColor: "#E8F5EC",
  },
  badgeText: { color: "#1B4332", textTransform: "capitalize", fontWeight: "700", fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
    color: "#2D3436",
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  map: { marginTop: 8, height: 220, borderRadius: 12 },
  cta: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#1B4332",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});

const placesStyles = {
  textInputContainer: { backgroundColor: "transparent", padding: 0 },
  textInput: {
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    height: 44,
    color: "#2D3436",
    fontSize: 14,
  },
  listView: {
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
  },
};
