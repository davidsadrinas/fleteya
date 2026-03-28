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
  /** Estrategia de matching usada al asignar conductor (ej. default_v1). */
  assignmentStrategyId?: string;
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

export type EvidenceStage = "pickup" | "delivery";

export interface ShipmentEvidence {
  id: string;
  shipmentId: string;
  uploadedBy: string;
  stage: EvidenceStage;
  fileUrl: string;
  note?: string;
  createdAt: string;
}

export interface ShipmentChatMessage {
  id: string;
  shipmentId: string;
  senderUserId: string;
  body: string;
  quickTag?: string;
  createdAt: string;
}

export type DisputeStatus = "open" | "under_review" | "resolved" | "rejected";

export interface ShipmentDispute {
  id: string;
  shipmentId: string;
  reportedBy: string;
  reason: string;
  description?: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  resolutionNote?: string;
  resolvedAt?: string;
  createdAt: string;
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
export type PayoutStatus = "pending" | "scheduled" | "released" | "failed";

export interface Payment {
  id: string;
  shipmentId: string;
  amount: number;
  commission: number;
  driverPayout: number;
  status: PaymentStatus;
  payoutStatus: PayoutStatus;
  mercadopagoId?: string;
  mercadopagoPreferenceId?: string;
  mercadopagoPaymentType?: string;
  payoutScheduledAt?: string;
  payoutReleasedAt?: string;
  webhookVerified: boolean;
  createdAt: string;
}

// Admin
export interface AdminAction {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface PlatformStats {
  total_users: number;
  total_drivers: number;
  verified_drivers: number;
  pending_verification: number;
  total_shipments: number;
  active_shipments: number;
  delivered_shipments: number;
  cancelled_shipments: number;
  open_disputes: number;
  total_revenue: number;
  total_gmv: number;
  total_referrals: number;
  active_referral_codes: number;
}

// Referral
export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  uses: number;
  maxUses: number;
  rewardAmount: number;
  active: boolean;
  createdAt: string;
}

export interface ReferralRedemption {
  id: string;
  codeId: string;
  referredUserId: string;
  referrerUserId: string;
  referrerReward: number;
  referredReward: number;
  referrerCredited: boolean;
  referredCredited: boolean;
  firstShipmentId?: string;
  createdAt: string;
}

// Web Push
export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  authKey: string;
  active: boolean;
  createdAt: string;
}

// Instant Quote
export interface QuoteSession {
  id: string;
  sessionToken: string;
  legs: QuoteLeg[];
  shipmentType?: string;
  vehicleType?: string;
  basePrice?: number;
  finalPrice?: number;
  commission?: number;
  converted: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface QuoteLeg {
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  distanceKm: number;
  price: number;
  discount: number;
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
