/**
 * Tests for shared pricing utilities — calcPriceCascade, calcChainDiscount, etc.
 */
import { describe, expect, it } from "vitest";
import {
  calcChainDiscount,
  calcCommission,
  calcPriceCascade,
  calcDistanceKm,
  formatARS,
} from "../src/utils/index";
import { COMMISSION } from "../src/types/index";

describe("calcDistanceKm", () => {
  it("returns 0 for same point", () => {
    expect(calcDistanceKm(-34.6, -58.4, -34.6, -58.4)).toBe(0);
  });

  it("calculates Buenos Aires distances reasonably", () => {
    // Obelisco to Aeroparque (~5km)
    const dist = calcDistanceKm(-34.6037, -58.3816, -34.5581, -58.4155);
    expect(dist).toBeGreaterThan(4);
    expect(dist).toBeLessThan(7);
  });

  it("handles long distances", () => {
    // Buenos Aires to Córdoba (~650km)
    const dist = calcDistanceKm(-34.6, -58.4, -31.4, -64.2);
    expect(dist).toBeGreaterThan(600);
    expect(dist).toBeLessThan(700);
  });
});

describe("calcChainDiscount", () => {
  it("returns 0 for first leg", () => {
    expect(calcChainDiscount(0, 3)).toBe(0);
  });

  it("returns positive discount for subsequent legs", () => {
    expect(calcChainDiscount(1, 3)).toBeGreaterThan(0);
    expect(calcChainDiscount(2, 3)).toBeGreaterThan(calcChainDiscount(1, 3));
  });

  it("returns 0 for single-leg shipment", () => {
    expect(calcChainDiscount(0, 1)).toBe(0);
  });
});

describe("calcCommission", () => {
  it("applies base commission rate", () => {
    const commission = calcCommission(10000, false);
    expect(commission).toBe(Math.round(10000 * COMMISSION.BASE_RATE));
  });

  it("applies backhaul rate when flagged", () => {
    const commission = calcCommission(10000, true);
    expect(commission).toBe(Math.round(10000 * COMMISSION.BACKHAUL_RATE));
  });

  it("backhaul commission is less than base", () => {
    expect(calcCommission(10000, true)).toBeLessThan(calcCommission(10000, false));
  });
});

describe("calcPriceCascade", () => {
  it("returns all pricing fields", () => {
    const result = calcPriceCascade(10000, false);
    expect(result).toHaveProperty("fletePrice");
    expect(result).toHaveProperty("commission");
    expect(result).toHaveProperty("driverPayout");
    expect(result).toHaveProperty("pasarela");
    expect(result).toHaveProperty("seguro");
    expect(result).toHaveProperty("netMargin");
    expect(result.commission).toBeGreaterThan(0);
    expect(result.driverPayout).toBeGreaterThan(0);
  });

  it("driver payout + commission = flete price", () => {
    const result = calcPriceCascade(25000, false);
    expect(result.driverPayout + result.commission).toBe(25000);
  });

  it("backhaul gives driver more payout", () => {
    const normal = calcPriceCascade(10000, false);
    const backhaul = calcPriceCascade(10000, true);
    expect(backhaul.driverPayout).toBeGreaterThan(normal.driverPayout);
  });

  it("higher price means proportionally higher costs", () => {
    const small = calcPriceCascade(5000, false);
    const big = calcPriceCascade(50000, false);
    expect(big.commission).toBeGreaterThan(small.commission);
    expect(big.pasarela).toBeGreaterThan(small.pasarela);
  });
});

describe("formatARS", () => {
  it("formats integers with $ prefix", () => {
    const formatted = formatARS(15000);
    expect(formatted).toContain("15");
    expect(formatted).toContain("$");
  });

  it("handles zero", () => {
    const formatted = formatARS(0);
    expect(formatted).toContain("0");
  });
});
