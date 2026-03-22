// User roles
export type UserRole = "client" | "driver" | "admin";

// Auth
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

// Driver
export interface Driver {
  id: string;
  userId: string;
  verified: boolean;
  dniVerified: boolean;
  dniUrl?: string;
  dniBackUrl?: string;
  selfieUrl?: string;
  licenseUrl?: string;
  licenseExpiry?: string;
  insuranceUrl?: string;
  insuranceExpiry?: string;
  vtvUrl?: string;
  vtvExpiry?: string;
  rating: number;
  totalTrips: number;
  createdAt: string;
}

// Vehicle
export type VehicleType = "moto" | "utilitario" | "camioneta" | "camion" | "grua" | "atmosferico";

export interface Vehicle {
  id: string;
  driverId: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  plate: string;
  capacity: string;
  photoUrl?: string;
  active: boolean;
  // Specialized certifications
  hazmatCertUrl?: string; // Certificado Ambiental (Ley 24.051) for atmosféricos
  hazmatCertExpiry?: string;
  towingLicenseUrl?: string; // Habilitación de grúa
  towingLicenseExpiry?: string;
  createdAt: string;
}

// Shipment
export type ShipmentStatus =
  | "pending"
  | "accepted"
  | "heading_to_origin"
  | "at_origin"
  | "loading"
  | "in_transit"
  | "arriving"
  | "delivered"
  | "cancelled";

export type ShipmentType = "mudanza" | "mercaderia" | "materiales" | "electrodomesticos" | "muebles" | "acarreo_vehiculo" | "limpieza_atmosferico" | "residuos";

export interface Shipment {
  id: string;
  clientId: string;
  driverId?: string;
  vehicleId?: string;
  status: ShipmentStatus;
  type: ShipmentType;
  description?: string;
  weight?: string;
  helpers: number;
  scheduledAt: string;
  basePrice: number;
  discount: number;
  finalPrice: number;
  commission: number;
  isBackhaul: boolean;
  createdAt: string;
}

export interface ShipmentLeg {
  id: string;
  shipmentId: string;
  legOrder: number;
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  distanceKm: number;
  estimatedMinutes: number;
  price: number;
  discount: number;
}

// Tracking
export interface TrackingPoint {
  id: string;
  shipmentId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

// Review
export interface Review {
  id: string;
  shipmentId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// Payment
export type PaymentStatus = "pending" | "approved" | "rejected" | "refunded";

export interface Payment {
  id: string;
  shipmentId: string;
  amount: number;
  commission: number;
  driverPayout: number;
  status: PaymentStatus;
  mercadopagoId?: string;
  createdAt: string;
}

// Vehicle type metadata
export const VEHICLE_TYPES: Record<VehicleType, { icon: string; label: string; capacity: string; requiresSpecialCert: boolean }> = {
  moto: { icon: "🏍️", label: "Moto", capacity: "Hasta 20kg", requiresSpecialCert: false },
  utilitario: { icon: "🚐", label: "Utilitario", capacity: "Hasta 500kg", requiresSpecialCert: false },
  camioneta: { icon: "🛻", label: "Camioneta", capacity: "Hasta 1.5tn", requiresSpecialCert: false },
  camion: { icon: "🚛", label: "Camión", capacity: "Hasta 6tn", requiresSpecialCert: false },
  grua: { icon: "🏗️", label: "Grúa / Auxilio", capacity: "Acarreo de vehículos", requiresSpecialCert: true },
  atmosferico: { icon: "🧪", label: "Atmosférico", capacity: "Residuos / Limpieza", requiresSpecialCert: true },
};

// Shipment status metadata
export const STATUS_META: Record<ShipmentStatus, { label: string; icon: string; color: string }> = {
  pending: { label: "Pendiente", icon: "⏳", color: "#FBBF24" },
  accepted: { label: "Aceptado", icon: "✓", color: "#A78BFA" },
  heading_to_origin: { label: "En camino al origen", icon: "🚛", color: "#3B82F6" },
  at_origin: { label: "En el origen", icon: "📍", color: "#FBBF24" },
  loading: { label: "Cargando", icon: "📦", color: "#FBBF24" },
  in_transit: { label: "En tránsito", icon: "🚛", color: "#40916C" },
  arriving: { label: "Llegando", icon: "🏁", color: "#34D399" },
  delivered: { label: "Entregado", icon: "✅", color: "#34D399" },
  cancelled: { label: "Cancelado", icon: "✕", color: "#F87171" },
};

// Commission config
export const COMMISSION = {
  BASE_RATE: 0.22, // 22%
  BACKHAUL_RATE: 0.15, // 15% for backhaul legs
  CHAIN_DISCOUNTS: [0, 0.15, 0.27, 0.39, 0.45], // per leg index
  CIRCUIT_BONUS: 0.08,
};
