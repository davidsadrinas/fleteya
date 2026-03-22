import { create } from "zustand";

// Theme store (light/dark mode)
type ThemeMode = "light" | "dark" | "system";

interface ThemeStore {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: "system",
  resolved: "light",
  setMode: (mode) => {
    const resolved = mode === "system"
      ? (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
    set({ mode, resolved });
  },
}));

// Auth store
interface AuthStore {
  user: { id: string; email: string; name: string; role: string; avatarUrl?: string } | null;
  loading: boolean;
  setUser: (user: AuthStore["user"]) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, loading: false }),
}));

// Shipment wizard store
interface ShipmentWizardStore {
  step: number;
  data: {
    type: string;
    description: string;
    weight: string;
    helpers: number;
    vehicleType: string;
    when: string;
    legs: Array<{
      from: string;
      to: string;
      fromCoords: { lat: number; lng: number } | null;
      toCoords: { lat: number; lng: number } | null;
    }>;
    selectedDriverId: string | null;
    // Acarreo specific
    acarreoVehicle?: { brand: string; model: string; plate: string; reason: string };
  };
  setStep: (step: number) => void;
  updateData: (partial: Partial<ShipmentWizardStore["data"]>) => void;
  addLeg: () => void;
  removeLeg: (index: number) => void;
  updateLeg: (index: number, field: string, value: string, coords?: { lat: number; lng: number }) => void;
  reset: () => void;
}

const initialWizardData: ShipmentWizardStore["data"] = {
  type: "", description: "", weight: "", helpers: 0, vehicleType: "", when: "Hoy",
  legs: [{ from: "", to: "", fromCoords: null, toCoords: null }],
  selectedDriverId: null,
};

export const useShipmentWizard = create<ShipmentWizardStore>((set, get) => ({
  step: 0,
  data: { ...initialWizardData },
  setStep: (step) => set({ step }),
  updateData: (partial) => set((s) => ({ data: { ...s.data, ...partial } })),
  addLeg: () => set((s) => {
    const last = s.data.legs[s.data.legs.length - 1];
    return {
      data: {
        ...s.data,
        legs: [...s.data.legs, { from: last.to, to: "", fromCoords: last.toCoords, toCoords: null }],
      },
    };
  }),
  removeLeg: (index) => set((s) => ({
    data: { ...s.data, legs: s.data.legs.slice(0, index) },
  })),
  updateLeg: (index, field, value, coords) => set((s) => {
    const legs = [...s.data.legs];
    legs[index] = {
      ...legs[index],
      [field]: value,
      ...(coords ? { [field === "from" ? "fromCoords" : "toCoords"]: coords } : {}),
    };
    if (field === "to" && index < legs.length - 1) {
      legs[index + 1] = { ...legs[index + 1], from: value, fromCoords: coords || legs[index + 1].fromCoords };
    }
    return { data: { ...s.data, legs } };
  }),
  reset: () => set({ step: 0, data: { ...initialWizardData } }),
}));

// Active tracking store
interface TrackingStore {
  shipmentId: string | null;
  driverPosition: { lat: number; lng: number } | null;
  status: string;
  eta: number;
  setShipmentId: (id: string) => void;
  updatePosition: (pos: { lat: number; lng: number }) => void;
  updateStatus: (status: string, eta: number) => void;
  clear: () => void;
}

export const useTrackingStore = create<TrackingStore>((set) => ({
  shipmentId: null,
  driverPosition: null,
  status: "pending",
  eta: 0,
  setShipmentId: (id) => set({ shipmentId: id }),
  updatePosition: (pos) => set({ driverPosition: pos }),
  updateStatus: (status, eta) => set({ status, eta }),
  clear: () => set({ shipmentId: null, driverPosition: null, status: "pending", eta: 0 }),
}));
