import { describe, expect, it, vi, beforeEach } from "vitest";
import { calculateShipmentPricing } from "@/lib/pricing";

const calculateRoute = vi.fn();

vi.mock("@/lib/routes", () => ({
  calculateRoute: (...args: Parameters<typeof calculateRoute>) =>
    calculateRoute(...args),
}));

describe("pricing engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses one backend path and returns deterministic custom pricing", async () => {
    calculateRoute.mockResolvedValue({
      distanceKm: 10,
      durationMinutes: 25,
      polyline: "abc",
    });

    const resultA = await calculateShipmentPricing({
      legs: [
        {
          originAddress: "A",
          originLat: -34.6,
          originLng: -58.4,
          destAddress: "B",
          destLat: -34.5,
          destLng: -58.3,
        },
      ],
      pricing: {
        calculator: "custom",
        custom: {
          baseFee: 1000,
          perKmRate: 200,
          perMinuteRate: 10,
          demandMultiplier: 1.2,
        },
      },
    });

    const resultB = await calculateShipmentPricing({
      legs: [
        {
          originAddress: "A",
          originLat: -34.6,
          originLng: -58.4,
          destAddress: "B",
          destLat: -34.5,
          destLng: -58.3,
        },
      ],
      pricing: {
        calculator: "custom",
        custom: {
          baseFee: 1000,
          perKmRate: 200,
          perMinuteRate: 10,
          demandMultiplier: 1.2,
        },
      },
    });

    expect(resultA.finalPrice).toBe(3900);
    expect(resultB.finalPrice).toBe(3900);
    expect(resultA.finalPrice).toBe(resultB.finalPrice);
  });

  it("supports distance, time and demand calculators", async () => {
    calculateRoute.mockResolvedValue({
      distanceKm: 8,
      durationMinutes: 20,
      polyline: "abc",
    });

    const distanceResult = await calculateShipmentPricing({
      legs: [
        {
          originAddress: "A",
          originLat: -34.6,
          originLng: -58.4,
          destAddress: "B",
          destLat: -34.5,
          destLng: -58.3,
        },
      ],
      pricing: { calculator: "distance" },
    });

    const timeResult = await calculateShipmentPricing({
      legs: [
        {
          originAddress: "A",
          originLat: -34.6,
          originLng: -58.4,
          destAddress: "B",
          destLat: -34.5,
          destLng: -58.3,
        },
      ],
      pricing: { calculator: "time" },
    });

    const demandResult = await calculateShipmentPricing({
      legs: [
        {
          originAddress: "A",
          originLat: -34.6,
          originLng: -58.4,
          destAddress: "B",
          destLat: -34.5,
          destLng: -58.3,
        },
      ],
      pricing: { calculator: "demand", demandMultiplier: 1.5 },
    });

    expect(distanceResult.finalPrice).toBe(17600);
    expect(timeResult.finalPrice).toBe(8400);
    expect(demandResult.finalPrice).toBe(26400);
  });
});
