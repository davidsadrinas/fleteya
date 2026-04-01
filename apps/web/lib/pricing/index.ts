import { calculateRoute } from "@/lib/routes";
import { calcChainDiscount, calcDistanceKm } from "@shared/utils";

type PricingCalculatorType = "distance" | "time" | "demand" | "custom";

interface LegInput {
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
}

interface CustomPricingConfig {
  baseFee: number;
  perKmRate: number;
  perMinuteRate: number;
  demandMultiplier: number;
}

export interface PricingConfig {
  calculator: PricingCalculatorType;
  demandMultiplier?: number;
  custom?: CustomPricingConfig;
}

interface PriceCalculationInput {
  distanceKm: number;
  estimatedMinutes: number;
}

interface FreightPriceCalculator {
  calculateBasePrice(input: PriceCalculationInput): number;
}

// Aliases requested for product terminology.
export type CalcularPrecioDeFlete = FreightPriceCalculator;

class CalculateTripByDistance implements FreightPriceCalculator {
  constructor(
    private readonly baseFee: number,
    private readonly perKmRate: number
  ) {}

  calculateBasePrice(input: PriceCalculationInput): number {
    return Math.round(this.baseFee + input.distanceKm * this.perKmRate);
  }
}

class CalculateTripByTime implements FreightPriceCalculator {
  constructor(
    private readonly baseFee: number,
    private readonly perMinuteRate: number
  ) {}

  calculateBasePrice(input: PriceCalculationInput): number {
    return Math.round(this.baseFee + input.estimatedMinutes * this.perMinuteRate);
  }
}

class CalculateTripByDemand implements FreightPriceCalculator {
  constructor(
    private readonly baseFee: number,
    private readonly perKmRate: number,
    private readonly demandMultiplier: number
  ) {}

  calculateBasePrice(input: PriceCalculationInput): number {
    return Math.round(
      (this.baseFee + input.distanceKm * this.perKmRate) * this.demandMultiplier
    );
  }
}

class CalculateTripCustom implements FreightPriceCalculator {
  constructor(private readonly config: CustomPricingConfig) {}

  calculateBasePrice(input: PriceCalculationInput): number {
    const subtotal =
      this.config.baseFee +
      input.distanceKm * this.config.perKmRate +
      input.estimatedMinutes * this.config.perMinuteRate;
    return Math.round(subtotal * this.config.demandMultiplier);
  }
}

export const CalcularViajePorDistancia = CalculateTripByDistance;
export const CalcularViajePorTiempo = CalculateTripByTime;
export const CalcularViajePorDemanda = CalculateTripByDemand;
export const CalcularViajeCustom = CalculateTripCustom;

interface EstimatedLeg {
  distanceKm: number;
  estimatedMinutes: number;
  polyline?: string;
}

interface PricedLeg extends LegInput, EstimatedLeg {
  legOrder: number;
  price: number;
  discount: number;
}

interface CalculatePricingInput {
  legs: LegInput[];
  pricing?: PricingConfig;
  includePolyline?: boolean;
}

interface CalculatePricingResult {
  legs: PricedLeg[];
  basePrice: number;
  finalPrice: number;
  savings: number;
  appliedPricing: Required<PricingConfig>;
}

const DEFAULTS = {
  BASE_FEE: 3200,
  PER_KM_RATE: 1800,
  PER_MINUTE_RATE: 260,
  DEMAND_MULTIPLIER: 1,
  HAVERSINE_CORRECTION_FACTOR: 1.3,
  AVG_SPEED_KMH: 30,
} as const;

function normalizePricingConfig(pricing?: PricingConfig): Required<PricingConfig> {
  const calculator = pricing?.calculator ?? "distance";
  return {
    calculator,
    demandMultiplier: pricing?.demandMultiplier ?? DEFAULTS.DEMAND_MULTIPLIER,
    custom: pricing?.custom ?? {
      baseFee: DEFAULTS.BASE_FEE,
      perKmRate: DEFAULTS.PER_KM_RATE,
      perMinuteRate: 0,
      demandMultiplier: DEFAULTS.DEMAND_MULTIPLIER,
    },
  };
}

function buildCalculator(pricing: Required<PricingConfig>): FreightPriceCalculator {
  switch (pricing.calculator) {
    case "time":
      return new CalculateTripByTime(DEFAULTS.BASE_FEE, DEFAULTS.PER_MINUTE_RATE);
    case "demand":
      return new CalculateTripByDemand(
        DEFAULTS.BASE_FEE,
        DEFAULTS.PER_KM_RATE,
        pricing.demandMultiplier
      );
    case "custom":
      return new CalculateTripCustom(pricing.custom);
    case "distance":
    default:
      return new CalculateTripByDistance(DEFAULTS.BASE_FEE, DEFAULTS.PER_KM_RATE);
  }
}

async function estimateLeg(leg: LegInput): Promise<EstimatedLeg> {
  const route = await calculateRoute(
    { lat: leg.originLat, lng: leg.originLng },
    { lat: leg.destLat, lng: leg.destLng }
  );

  if (route) {
    return {
      distanceKm: route.distanceKm,
      estimatedMinutes: route.durationMinutes,
      polyline: route.polyline,
    };
  }

  const haversine = calcDistanceKm(
    leg.originLat,
    leg.originLng,
    leg.destLat,
    leg.destLng
  );
  const distanceKm = haversine * DEFAULTS.HAVERSINE_CORRECTION_FACTOR;
  const estimatedMinutes = Math.ceil((distanceKm / DEFAULTS.AVG_SPEED_KMH) * 60);
  return { distanceKm, estimatedMinutes };
}

export async function calculateShipmentPricing(
  input: CalculatePricingInput
): Promise<CalculatePricingResult> {
  const appliedPricing = normalizePricingConfig(input.pricing);
  const calculator = buildCalculator(appliedPricing);
  let totalBase = 0;

  const pricedLegs: PricedLeg[] = [];
  for (let i = 0; i < input.legs.length; i++) {
    const leg = input.legs[i];
    const estimated = await estimateLeg(leg);
    const basePrice = calculator.calculateBasePrice({
      distanceKm: estimated.distanceKm,
      estimatedMinutes: estimated.estimatedMinutes,
    });
    const chainDiscount = calcChainDiscount(i, input.legs.length);
    const finalLegPrice = Math.round(basePrice * (1 - chainDiscount));
    totalBase += basePrice;

    pricedLegs.push({
      ...leg,
      legOrder: i,
      distanceKm: estimated.distanceKm,
      estimatedMinutes: estimated.estimatedMinutes,
      polyline: input.includePolyline ? estimated.polyline : undefined,
      price: finalLegPrice,
      discount: Math.round(chainDiscount * 100),
    });
  }

  const totalFinal = pricedLegs.reduce((sum, leg) => sum + leg.price, 0);
  return {
    legs: pricedLegs,
    basePrice: totalBase,
    finalPrice: totalFinal,
    savings: totalBase - totalFinal,
    appliedPricing,
  };
}
