export const APP_NAME = "FleteYa";
export const APP_TAGLINE = "Fletes inteligentes. Ida y vuelta.";
export const APP_DOMAIN = "fletaya.com.ar";

export const AMBA_CENTER = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires
export const AMBA_RADIUS_KM = 60;

export const MAX_LEGS_PER_SHIPMENT = 5;
export const MAX_VEHICLES_PER_DRIVER = 5;

export const DRIVER_SEARCH_RADIUS_KM = 15;
export const BACKHAUL_SEARCH_RADIUS_KM = 5;

export const PAYMENT_RELEASE_HOURS = 48;

export const MERCADOPAGO_FEE_RATE = 0.034; // ~3.4% average
export const INSURANCE_FEE_RATE = 0.025; // ~2.5%

export const SUPPORTED_DOC_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const MAX_DOC_SIZE_MB = 10;

export const SHIPMENT_TYPES = [
  { id: "mudanza", label: "Mudanza", icon: "🏠", category: "general" },
  { id: "mercaderia", label: "Mercadería", icon: "📦", category: "general" },
  { id: "materiales", label: "Materiales", icon: "🧱", category: "general" },
  { id: "electrodomesticos", label: "Electrodomésticos", icon: "🔌", category: "general" },
  { id: "muebles", label: "Muebles", icon: "🪑", category: "general" },
  { id: "acarreo_vehiculo", label: "Acarreo de vehículo", icon: "🚗", category: "vehiculo" },
  { id: "limpieza_atmosferico", label: "Limpieza / Atmosférico", icon: "🧪", category: "especial" },
  { id: "residuos", label: "Residuos industriales", icon: "♻️", category: "especial" },
] as const;

export const WEIGHT_OPTIONS = [
  { id: "light", label: "Hasta 20kg" },
  { id: "medium", label: "20-200kg" },
  { id: "heavy", label: "200-1500kg" },
  { id: "xheavy", label: "+1500kg" },
] as const;

export const HELPER_OPTIONS = [
  { id: 0, label: "Sin ayudantes" },
  { id: 1, label: "1 ayudante" },
  { id: 2, label: "2 ayudantes" },
] as const;

// Referral program
export const REFERRAL_REWARD_AMOUNT = 500; // ARS
export const REFERRAL_MAX_USES = 50;
export const REFERRAL_CODE_LENGTH = 8;

// Rate limit defaults
export const RATE_LIMIT_MAX_ENTRIES = 10_000;
export const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60_000; // 1 minute

// Web push VAPID (public key only - private key in env)
export const VAPID_SUBJECT = "mailto:soporte@fletaya.com.ar";

// Admin
export const ADMIN_DISPUTE_RESOLUTIONS = [
  { id: "resolved_favor_client", label: "Resuelto a favor del cliente" },
  { id: "resolved_favor_driver", label: "Resuelto a favor del fletero" },
  { id: "resolved_partial", label: "Resolución parcial" },
  { id: "rejected", label: "Rechazado" },
] as const;

// Document expiry warning (days before expiry)
export const DOC_EXPIRY_WARNING_DAYS = 30;

// Minimum driver rating to be eligible for assignment (0-5 scale)
export const MIN_DRIVER_RATING = 3.0;
