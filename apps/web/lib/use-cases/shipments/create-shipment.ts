import { COMMISSION } from "@shared/types";
import { calcChainDiscount, calcDistanceKm } from "@shared/utils";

interface ShipmentLegInput {
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
}

interface CreateShipmentInput {
  supabase: any;
  userId: string;
  payload: {
    type: string;
    description?: string | null;
    weight?: number | null;
    helpers: number;
    scheduledAt?: string | null;
    legs: ShipmentLegInput[];
  };
}

export async function createShipmentWithPricing(input: CreateShipmentInput) {
  const { supabase, userId, payload } = input;

  let totalBase = 0;
  const legsWithPricing = payload.legs.map((leg, i) => {
    const distKm = calcDistanceKm(leg.originLat, leg.originLng, leg.destLat, leg.destLng);
    const basePrice = Math.round(3200 + distKm * 1800);
    const chainDiscount = calcChainDiscount(i, payload.legs.length);
    const legPrice = Math.round(basePrice * (1 - chainDiscount));
    totalBase += basePrice;
    return {
      ...leg,
      legOrder: i,
      distanceKm: distKm,
      estimatedMinutes: Math.round(distKm * 3.5),
      price: legPrice,
      discount: chainDiscount * 100,
    };
  });

  const totalFinal = legsWithPricing.reduce((s, l) => s + l.price, 0);
  const commission = Math.round(totalFinal * COMMISSION.BASE_RATE);

  const rpcLegs = legsWithPricing.map((leg) => ({
    leg_order: leg.legOrder,
    origin_address: leg.originAddress,
    origin_lat: leg.originLat,
    origin_lng: leg.originLng,
    dest_address: leg.destAddress,
    dest_lat: leg.destLat,
    dest_lng: leg.destLng,
    distance_km: leg.distanceKm,
    estimated_minutes: leg.estimatedMinutes,
    price: leg.price,
    discount: leg.discount,
  }));

  const { data: createdShipmentId, error: rpcError } = await supabase.rpc("create_shipment_with_legs", {
    p_client_id: userId,
    p_type: payload.type,
    p_description: payload.description ?? null,
    p_weight: payload.weight ?? null,
    p_helpers: payload.helpers,
    p_scheduled_at: payload.scheduledAt || new Date().toISOString(),
    p_base_price: totalBase,
    p_discount: Math.round(((totalBase - totalFinal) / totalBase) * 100),
    p_final_price: totalFinal,
    p_commission: commission,
    p_legs: rpcLegs,
  });
  if (rpcError || !createdShipmentId) {
    throw new Error(rpcError?.message ?? "No se pudo crear el envío");
  }

  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .select("*")
    .eq("id", createdShipmentId)
    .single();
  if (shipmentError) {
    throw new Error(shipmentError.message);
  }

  return { shipment, legs: legsWithPricing };
}
