import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").optional(),
});

export const onboardingSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  phone: z.string().min(8, "Teléfono inválido").regex(/^[\d\s\-+()]+$/, "Solo números"),
  role: z.enum(["client", "driver"]),
});

// Shipment
export const shipmentLegSchema = z.object({
  originAddress: z.string().min(3, "Dirección requerida"),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destAddress: z.string().min(3, "Dirección requerida"),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
});

export const createShipmentSchema = z.object({
  type: z.enum(["mudanza", "mercaderia", "materiales", "electrodomesticos", "muebles", "acarreo_vehiculo", "limpieza_atmosferico", "residuos"]),
  description: z.string().max(500).optional(),
  weight: z.enum(["light", "medium", "heavy", "xheavy"]).optional(),
  helpers: z.number().min(0).max(3).default(0),
  vehicleType: z.enum(["moto", "utilitario", "camioneta", "camion", "grua", "atmosferico"]).optional(),
  scheduledAt: z.string().datetime().optional(),
  legs: z.array(shipmentLegSchema).min(1, "Al menos un tramo").max(5, "Máximo 5 tramos"),
});

// Vehicle
export const createVehicleSchema = z.object({
  type: z.enum(["moto", "utilitario", "camioneta", "camion", "grua", "atmosferico"]),
  brand: z.string().min(2, "Marca requerida"),
  model: z.string().optional().default(""),
  year: z.number().min(1990).max(new Date().getFullYear() + 1),
  plate: z.string().min(4, "Patente requerida").max(12),
  capacity: z.string().optional(),
});

// Review
export const createReviewSchema = z.object({
  shipmentId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// Driver document upload
export const documentUploadSchema = z.object({
  documentType: z.enum(["dni_front", "dni_back", "selfie", "license", "insurance", "vtv", "hazmat_cert", "towing_license"]),
  fileType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
  fileSize: z.number().max(10 * 1024 * 1024, "Máximo 10MB"),
});

// Tracking point
export const trackingPointSchema = z.object({
  shipmentId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
});

// Acarreo specific
export const acarreoVehicleSchema = z.object({
  brand: z.string().min(2),
  model: z.string().min(1),
  plate: z.string().min(4),
  reason: z.enum(["averia", "compraventa", "traslado", "otro"]),
  notes: z.string().max(300).optional(),
});

// Quote (no auth)
export const quoteSchema = z.object({
  legs: z.array(shipmentLegSchema).min(1).max(5),
  shipmentType: z
    .enum(["mudanza", "mercaderia", "materiales", "electrodomesticos", "muebles", "acarreo_vehiculo", "limpieza_atmosferico", "residuos"])
    .optional(),
  vehicleType: z.enum(["moto", "utilitario", "camioneta", "camion", "grua", "atmosferico"]).optional(),
});

// Push subscription
export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

// Referral
export const redeemReferralSchema = z.object({
  code: z.string().min(3).max(20),
});

// Admin
export const verifyDriverSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

export const resolveDisputeSchema = z.object({
  status: z.enum(["under_review", "resolved", "rejected"]),
  resolution_note: z.string().max(1000).optional(),
});

// Payment
export const createPaymentSchema = z.object({
  shipmentId: z.string().uuid(),
});

// Push send
export const pushSendSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  url: z.string().optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type TrackingPointInput = z.infer<typeof trackingPointSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type RedeemReferralInput = z.infer<typeof redeemReferralSchema>;
