import { describe, it, expect } from "vitest";
import {
  createShipmentSchema,
  createVehicleSchema,
  createReviewSchema,
  trackingPointSchema,
  documentUploadSchema,
  loginSchema,
  onboardingSchema,
  acarreoVehicleSchema,
} from "@/lib/schemas";

describe("createShipmentSchema", () => {
  const validShipment = {
    type: "mudanza" as const,
    description: "3 cajas grandes",
    weight: "medium" as const,
    helpers: 1,
    legs: [{ originAddress: "Palermo, CABA", originLat: -34.58, originLng: -58.43, destAddress: "Avellaneda", destLat: -34.66, destLng: -58.37 }],
  };

  it("validates a correct shipment", () => {
    const result = createShipmentSchema.safeParse(validShipment);
    expect(result.success).toBe(true);
  });

  it("rejects empty legs", () => {
    const result = createShipmentSchema.safeParse({ ...validShipment, legs: [] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 5 legs", () => {
    const legs = Array(6).fill(validShipment.legs[0]);
    const result = createShipmentSchema.safeParse({ ...validShipment, legs });
    expect(result.success).toBe(false);
  });

  it("rejects invalid shipment type", () => {
    const result = createShipmentSchema.safeParse({ ...validShipment, type: "invalid" });
    expect(result.success).toBe(false);
  });

  it("accepts new types: acarreo_vehiculo", () => {
    const result = createShipmentSchema.safeParse({ ...validShipment, type: "acarreo_vehiculo" });
    expect(result.success).toBe(true);
  });

  it("accepts new types: limpieza_atmosferico", () => {
    const result = createShipmentSchema.safeParse({ ...validShipment, type: "limpieza_atmosferico" });
    expect(result.success).toBe(true);
  });

  it("accepts new types: residuos", () => {
    const result = createShipmentSchema.safeParse({ ...validShipment, type: "residuos" });
    expect(result.success).toBe(true);
  });

  it("defaults helpers to 0", () => {
    const { helpers, ...rest } = validShipment;
    const result = createShipmentSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.helpers).toBe(0);
  });

  it("rejects invalid coordinates", () => {
    const badLeg = { ...validShipment.legs[0], originLat: 999 };
    const result = createShipmentSchema.safeParse({ ...validShipment, legs: [badLeg] });
    expect(result.success).toBe(false);
  });
});

describe("createVehicleSchema", () => {
  it("validates standard vehicle", () => {
    const result = createVehicleSchema.safeParse({ type: "camioneta", brand: "Ford", year: 2021, plate: "AC 234 BD" });
    expect(result.success).toBe(true);
  });

  it("accepts grua type", () => {
    const result = createVehicleSchema.safeParse({ type: "grua", brand: "Volvo", year: 2020, plate: "XX 123 YY" });
    expect(result.success).toBe(true);
  });

  it("accepts atmosferico type", () => {
    const result = createVehicleSchema.safeParse({ type: "atmosferico", brand: "Mercedes", year: 2019, plate: "ZZ 456 WW" });
    expect(result.success).toBe(true);
  });

  it("rejects year before 1990", () => {
    const result = createVehicleSchema.safeParse({ type: "camion", brand: "Ford", year: 1985, plate: "AB 123" });
    expect(result.success).toBe(false);
  });

  it("rejects short plate", () => {
    const result = createVehicleSchema.safeParse({ type: "moto", brand: "Honda", year: 2022, plate: "AB" });
    expect(result.success).toBe(false);
  });
});

describe("trackingPointSchema", () => {
  it("validates correct tracking point", () => {
    const result = trackingPointSchema.safeParse({
      shipmentId: "550e8400-e29b-41d4-a716-446655440000",
      lat: -34.58, lng: -58.43,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional speed and heading", () => {
    const result = trackingPointSchema.safeParse({
      shipmentId: "550e8400-e29b-41d4-a716-446655440000",
      lat: -34.58, lng: -58.43, speed: 45.5, heading: 180,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = trackingPointSchema.safeParse({
      shipmentId: "not-a-uuid",
      lat: -34.58, lng: -58.43,
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("validates email", () => {
    expect(loginSchema.safeParse({ email: "test@test.com" }).success).toBe(true);
  });
  it("rejects invalid email", () => {
    expect(loginSchema.safeParse({ email: "not-email" }).success).toBe(false);
  });
});

describe("onboardingSchema", () => {
  it("validates correct onboarding", () => {
    expect(onboardingSchema.safeParse({ name: "Juan", phone: "1155667788", role: "client" }).success).toBe(true);
  });
  it("rejects short name", () => {
    expect(onboardingSchema.safeParse({ name: "J", phone: "1155667788", role: "client" }).success).toBe(false);
  });
  it("accepts driver role", () => {
    expect(onboardingSchema.safeParse({ name: "Carlos", phone: "1155667788", role: "driver" }).success).toBe(true);
  });
});

describe("documentUploadSchema", () => {
  it("validates jpeg upload", () => {
    expect(documentUploadSchema.safeParse({ documentType: "dni_front", fileType: "image/jpeg", fileSize: 1024 * 1024 }).success).toBe(true);
  });
  it("rejects file > 10MB", () => {
    expect(documentUploadSchema.safeParse({ documentType: "license", fileType: "image/png", fileSize: 11 * 1024 * 1024 }).success).toBe(false);
  });
  it("accepts hazmat_cert for atmosferico", () => {
    expect(documentUploadSchema.safeParse({ documentType: "hazmat_cert", fileType: "application/pdf", fileSize: 5 * 1024 * 1024 }).success).toBe(true);
  });
  it("accepts towing_license for grua", () => {
    expect(documentUploadSchema.safeParse({ documentType: "towing_license", fileType: "image/jpeg", fileSize: 2 * 1024 * 1024 }).success).toBe(true);
  });
});

describe("acarreoVehicleSchema", () => {
  it("validates vehicle for towing", () => {
    expect(acarreoVehicleSchema.safeParse({ brand: "Toyota", model: "Corolla", plate: "AC 234 BD", reason: "averia" }).success).toBe(true);
  });
  it("rejects invalid reason", () => {
    expect(acarreoVehicleSchema.safeParse({ brand: "Ford", model: "Focus", plate: "AB 123 CD", reason: "invalid" }).success).toBe(false);
  });
});
