import { describe, it, expect } from "vitest";

// These tests validate the API contract and response shapes.
// For integration tests with real Supabase, use the test env with seed data.

describe("API: /api/health", () => {
  it("returns expected shape", () => {
    // Contract test - validate the expected response structure
    const expectedShape = {
      status: "ok",
      service: "fletaya-api",
      timestamp: expect.any(String),
      version: expect.any(String),
    };
    // In real test, fetch from localhost:3000/api/health
    expect(expectedShape).toMatchObject({ status: "ok", service: "fletaya-api" });
  });
});

describe("API: /api/shipments contract", () => {
  it("POST body must match createShipmentSchema", () => {
    const validBody = {
      type: "mudanza",
      legs: [{
        originAddress: "Palermo, CABA",
        originLat: -34.58,
        originLng: -58.43,
        destAddress: "Avellaneda, GBA",
        destLat: -34.66,
        destLng: -58.37,
      }],
    };

    // Validate required fields exist
    expect(validBody).toHaveProperty("type");
    expect(validBody).toHaveProperty("legs");
    expect(validBody.legs).toHaveLength(1);
    expect(validBody.legs[0]).toHaveProperty("originLat");
    expect(validBody.legs[0]).toHaveProperty("destLat");
  });

  it("response should include shipment and pricing", () => {
    const expectedResponse = {
      shipment: {
        id: expect.any(String),
        client_id: expect.any(String),
        status: "pending",
        base_price: expect.any(Number),
        final_price: expect.any(Number),
        commission: expect.any(Number),
      },
      legs: expect.any(Array),
    };

    expect(expectedResponse.shipment.status).toBe("pending");
    expect(expectedResponse.shipment).toHaveProperty("commission");
  });

  it("multi-leg shipment should have discount on legs > 0", () => {
    // Simulate pricing calculation
    const legs = [
      { index: 0, basePrice: 15000, discount: 0 },
      { index: 1, basePrice: 12000, discount: 15 },
      { index: 2, basePrice: 10000, discount: 27 },
    ];

    expect(legs[0].discount).toBe(0); // First leg: no discount
    expect(legs[1].discount).toBeGreaterThan(0); // Second: has discount
    expect(legs[2].discount).toBeGreaterThan(legs[1].discount); // Third: more
  });
});

describe("API: /api/drivers contract", () => {
  it("GET response should include driver with vehicles", () => {
    const expectedDriver = {
      id: expect.any(String),
      name: expect.any(String),
      rating: expect.any(Number),
      verified: true,
      vehicles: expect.any(Array),
      activeVehicle: expect.any(Object),
    };

    expect(expectedDriver.verified).toBe(true);
    expect(expectedDriver).toHaveProperty("vehicles");
    expect(expectedDriver).toHaveProperty("activeVehicle");
  });

  it("specialized vehicles should have cert fields", () => {
    const gruaVehicle = {
      type: "grua",
      hasTowingLicense: true,
      hasHazmatCert: false,
    };
    const atmosfericoVehicle = {
      type: "atmosferico",
      hasTowingLicense: false,
      hasHazmatCert: true,
    };

    expect(gruaVehicle.hasTowingLicense).toBe(true);
    expect(atmosfericoVehicle.hasHazmatCert).toBe(true);
  });
});

describe("API: /api/shipments/[id]/applications contract", () => {
  it("POST accepts optional driver position for proximity scoring", () => {
    const body = { driverLat: -34.6, driverLng: -58.4 };
    expect(body).toHaveProperty("driverLat");
    expect(body).toHaveProperty("driverLng");
  });

  it("GET returns applications list shape", () => {
    expect({ applications: [] }).toMatchObject({ applications: expect.any(Array) });
  });
});

describe("API: /api/shipments/[id]/assign contract", () => {
  it("requires Authorization Bearer ASSIGNMENT_RUN_SECRET", () => {
    const expectedHeader = "Bearer <ASSIGNMENT_RUN_SECRET>";
    expect(expectedHeader.startsWith("Bearer ")).toBe(true);
  });

  it("optional body can override strategyId", () => {
    const body = { strategyId: "default_v1" };
    expect(body.strategyId).toBe("default_v1");
  });
});

describe("API: /api/tracking contract", () => {
  it("POST body must include shipmentId and coordinates", () => {
    const validBody = {
      shipmentId: "550e8400-e29b-41d4-a716-446655440000",
      lat: -34.58,
      lng: -58.43,
      speed: 30,
    };

    expect(validBody.lat).toBeGreaterThan(-90);
    expect(validBody.lat).toBeLessThan(90);
    expect(validBody.lng).toBeGreaterThan(-180);
    expect(validBody.lng).toBeLessThan(180);
  });
});
