import { describe, it, expect } from "vitest";
import { calcChainDiscount, calcCommission, calcPriceCascade, calcDistanceKm, formatARS } from "../src/utils";

describe("calcChainDiscount", () => {
  it("returns 0 for first leg", () => {
    expect(calcChainDiscount(0, 3)).toBe(0);
  });

  it("returns 0 for single-leg shipment", () => {
    expect(calcChainDiscount(0, 1)).toBe(0);
    expect(calcChainDiscount(1, 1)).toBe(0);
  });

  it("returns increasing discount for subsequent legs", () => {
    const d1 = calcChainDiscount(1, 3);
    const d2 = calcChainDiscount(2, 3);
    expect(d2).toBeGreaterThan(d1);
    expect(d1).toBeGreaterThan(0);
  });

  it("adds circuit bonus when route is circular", () => {
    const withoutCircuit = calcChainDiscount(2, 3, false);
    const withCircuit = calcChainDiscount(2, 3, true);
    expect(withCircuit).toBeGreaterThan(withoutCircuit);
  });

  it("caps discount at 55%", () => {
    const maxDiscount = calcChainDiscount(10, 11, true);
    expect(maxDiscount).toBeLessThanOrEqual(0.55);
  });

  it("handles edge case: leg index 0 with circuit", () => {
    expect(calcChainDiscount(0, 3, true)).toBe(0);
  });
});

describe("calcCommission", () => {
  it("calculates standard commission at 22%", () => {
    expect(calcCommission(10000, false)).toBe(2200);
  });

  it("calculates backhaul commission at 15%", () => {
    expect(calcCommission(10000, true)).toBe(1500);
  });

  it("rounds to nearest integer", () => {
    const result = calcCommission(333, false);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("returns 0 for 0 price", () => {
    expect(calcCommission(0, false)).toBe(0);
  });
});

describe("calcPriceCascade", () => {
  it("returns complete breakdown for standard shipment", () => {
    const result = calcPriceCascade(22000, false);
    expect(result.fletePrice).toBe(22000);
    expect(result.commission).toBeGreaterThan(0);
    expect(result.pasarela).toBeGreaterThan(0);
    expect(result.seguro).toBeGreaterThan(0);
    expect(result.driverPayout).toBe(22000 - result.commission);
    expect(result.driverPayout + result.commission).toBe(22000);
  });

  it("calculates lower commission for backhaul", () => {
    const standard = calcPriceCascade(22000, false);
    const backhaul = calcPriceCascade(22000, true);
    expect(backhaul.commission).toBeLessThan(standard.commission);
    expect(backhaul.driverPayout).toBeGreaterThan(standard.driverPayout);
  });

  it("net margin is positive for typical price", () => {
    const result = calcPriceCascade(22000, false);
    expect(result.netMargin).toBeGreaterThan(0);
    expect(result.marginPercent).toBeGreaterThan(0);
  });

  it("pasarela is ~3.4% of total flete", () => {
    const result = calcPriceCascade(10000, false);
    expect(result.pasarela).toBe(340);
  });

  it("seguro is ~2.5% of total flete", () => {
    const result = calcPriceCascade(10000, false);
    expect(result.seguro).toBe(250);
  });
});

describe("calcDistanceKm", () => {
  it("returns 0 for same point", () => {
    expect(calcDistanceKm(-34.6, -58.4, -34.6, -58.4)).toBe(0);
  });

  it("calculates Palermo to Avellaneda correctly (~12km)", () => {
    const dist = calcDistanceKm(-34.5795, -58.4312, -34.6623, -58.3636);
    expect(dist).toBeGreaterThan(10);
    expect(dist).toBeLessThan(15);
  });

  it("is symmetric (A->B = B->A)", () => {
    const ab = calcDistanceKm(-34.58, -58.43, -34.66, -58.37);
    const ba = calcDistanceKm(-34.66, -58.37, -34.58, -58.43);
    expect(ab).toBe(ba);
  });

  it("returns reasonable values for AMBA distances", () => {
    // CABA to La Plata ~55km
    const dist = calcDistanceKm(-34.6037, -58.3816, -34.9215, -57.9545);
    expect(dist).toBeGreaterThan(45);
    expect(dist).toBeLessThan(65);
  });
});

describe("formatARS", () => {
  it("formats with $ prefix", () => {
    expect(formatARS(1000)).toContain("$");
  });

  it("formats large numbers with separators", () => {
    const result = formatARS(1500000);
    expect(result).toContain("$");
    expect(result.length).toBeGreaterThan(5);
  });

  it("handles 0", () => {
    expect(formatARS(0)).toBe("$0");
  });
});
