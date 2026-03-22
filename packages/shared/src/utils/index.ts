import { COMMISSION } from "../types";

/**
 * Calculate the chain discount for a specific leg in a multi-stop route.
 * Leg 0 (first) has no discount. Each subsequent leg gets increasing discounts.
 * If the route forms a circuit (last stop = first origin), an extra bonus applies.
 */
export function calcChainDiscount(
  legIndex: number,
  totalLegs: number,
  isCircuit: boolean = false
): number {
  if (totalLegs <= 1 || legIndex === 0) return 0;

  const baseDiscount = COMMISSION.CHAIN_DISCOUNTS[
    Math.min(legIndex, COMMISSION.CHAIN_DISCOUNTS.length - 1)
  ];
  const circuitBonus = isCircuit ? COMMISSION.CIRCUIT_BONUS : 0;

  return Math.min(baseDiscount + circuitBonus, 0.55); // Cap at 55%
}

/**
 * Calculate the platform commission for a shipment.
 * Backhaul legs use a reduced rate.
 */
export function calcCommission(price: number, isBackhaul: boolean): number {
  const rate = isBackhaul ? COMMISSION.BACKHAUL_RATE : COMMISSION.BASE_RATE;
  return Math.round(price * rate);
}

/**
 * Calculate the price cascade for a single transaction.
 * Returns breakdown of where each peso goes.
 */
export function calcPriceCascade(fletePrice: number, isBackhaul: boolean) {
  const commissionRate = isBackhaul ? COMMISSION.BACKHAUL_RATE : COMMISSION.BASE_RATE;
  const commission = Math.round(fletePrice * commissionRate);
  const pasarela = Math.round(fletePrice * 0.034); // MercadoPago ~3.4%
  const seguro = Math.round(fletePrice * 0.025); // RC insurance ~2.5%
  const ivaNet = Math.round(commission * 0.035); // Net IVA after credits
  const iibb = Math.round(commission * 0.035); // IIBB ~3.5%
  const ganancias = Math.round(commission * 0.05); // Ganancias proportional

  const totalCosts = pasarela + seguro + ivaNet + iibb + ganancias;
  const netMargin = commission - totalCosts;
  const driverPayout = fletePrice - commission;

  return {
    fletePrice,
    commission,
    commissionRate,
    pasarela,
    seguro,
    ivaNet,
    iibb,
    ganancias,
    totalCosts,
    netMargin,
    driverPayout,
    marginPercent: (netMargin / fletePrice) * 100,
  };
}

/**
 * Format ARS currency
 */
export function formatARS(amount: number): string {
  return `$${amount.toLocaleString("es-AR")}`;
}

/**
 * Calculate distance between two coordinates (Haversine)
 */
export function calcDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}
