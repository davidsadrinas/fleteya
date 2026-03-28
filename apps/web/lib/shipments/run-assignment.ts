import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAssignmentStrategy,
  haversineDistanceMeters,
  type AssignmentCandidate,
} from "@shared/assignment";
import { MIN_DRIVER_RATING, BACKHAUL_SEARCH_RADIUS_KM } from "@shared/constants";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";

const ACTIVE_DRIVER_STATUSES = [
  "accepted",
  "heading_to_origin",
  "at_origin",
  "loading",
  "in_transit",
  "arriving",
] as const;

type DriverEmbed = { rating: number; total_trips: number; verified: boolean };

type AppRow = {
  id: string;
  driver_id: string;
  driver_lat: number | null;
  driver_lng: number | null;
  drivers: DriverEmbed | null;
};

function singleDriverEmbed(
  relation: DriverEmbed | DriverEmbed[] | null | undefined
): DriverEmbed | null {
  if (relation == null) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export type RunAssignmentSuccess = {
  shipmentId: string;
  selectedDriverId: string;
  applicationId: string;
  strategyId: string;
  vehicleId: string | null;
};

export type RunAssignmentFailure = { status: number; error: string };

/** For drivers with several active trips, keep the chain end closest to this pickup (mejor encadenado). */
async function loadBestChainEndByDriver(
  admin: SupabaseClient,
  driverIds: string[],
  pickupLat: number,
  pickupLng: number
): Promise<Map<string, { lat: number; lng: number }>> {
  const bestCoords = new Map<string, { lat: number; lng: number }>();
  if (driverIds.length === 0) return bestCoords;

  const { data: activeShips, error } = await admin
    .from("shipments")
    .select("id, driver_id")
    .in("driver_id", driverIds)
    .in("status", [...ACTIVE_DRIVER_STATUSES]);

  if (error || !activeShips?.length) return bestCoords;

  const bestDist = new Map<string, number>();

  for (const row of activeShips) {
    if (!row.driver_id) continue;
    const { data: coordRows, error: rpcErr } = await admin.rpc("last_leg_dest_coords", {
      p_shipment_id: row.id,
    });
    if (rpcErr) continue;
    const dest = Array.isArray(coordRows) ? coordRows[0] : coordRows;
    const lat = dest?.lat;
    const lng = dest?.lng;
    if (lat == null || lng == null) continue;

    const dist = haversineDistanceMeters(lat, lng, pickupLat, pickupLng);
    const prev = bestDist.get(row.driver_id);
    if (prev === undefined || dist < prev) {
      bestDist.set(row.driver_id, dist);
      bestCoords.set(row.driver_id, { lat, lng });
    }
  }

  return bestCoords;
}

export async function runShipmentAssignment(options: {
  shipmentId: string;
  strategyId?: string | null;
  admin?: SupabaseClient;
}): Promise<{ ok: true; data: RunAssignmentSuccess } | { ok: false; data: RunAssignmentFailure }> {
  const shipmentId = options.shipmentId;
  const admin = options.admin ?? createServiceRoleSupabase();
  const strategy = getAssignmentStrategy(
    options.strategyId ?? process.env.ASSIGNMENT_STRATEGY_ID ?? null
  );

  const { data: shipment, error: shipError } = await admin
    .from("shipments")
    .select("id, driver_id, status")
    .eq("id", shipmentId)
    .maybeSingle();

  if (shipError || !shipment) {
    return { ok: false, data: { status: 404, error: shipError?.message ?? "Envío no encontrado" } };
  }
  if (shipment.driver_id || shipment.status !== "pending") {
    return {
      ok: false,
      data: { status: 409, error: "El envío ya tiene conductor o no está pendiente" },
    };
  }

  const { data: coordRows, error: coordError } = await admin.rpc("first_leg_origin_coords", {
    p_shipment_id: shipmentId,
  });

  if (coordError) {
    return { ok: false, data: { status: 500, error: coordError.message } };
  }

  const origin = Array.isArray(coordRows) ? coordRows[0] : coordRows;
  const pickupLat = origin?.lat ?? undefined;
  const pickupLng = origin?.lng ?? undefined;

  const { data: appRows, error: appError } = await admin
    .from("shipment_driver_applications")
    .select(
      "id, driver_id, driver_lat, driver_lng, drivers!inner(rating,total_trips,verified)"
    )
    .eq("shipment_id", shipmentId)
    .eq("status", "pending");

  if (appError) {
    return { ok: false, data: { status: 500, error: appError.message } };
  }

  const rows: AppRow[] = (appRows ?? []).map((r) => ({
    id: r.id,
    driver_id: r.driver_id,
    driver_lat: r.driver_lat,
    driver_lng: r.driver_lng,
    drivers: singleDriverEmbed(r.drivers),
  }));
  if (rows.length === 0) {
    return { ok: false, data: { status: 400, error: "No hay postulaciones pendientes" } };
  }

  const driverIds = Array.from(new Set(rows.map((r) => r.driver_id)));
  const chainEnds =
    pickupLat != null && pickupLng != null
      ? await loadBestChainEndByDriver(admin, driverIds, pickupLat, pickupLng)
      : new Map<string, { lat: number; lng: number }>();

  const candidates: AssignmentCandidate[] = rows.map((r) => {
    const d = r.drivers;
    let distanceMeters: number | undefined;
    if (
      pickupLat != null &&
      pickupLng != null &&
      r.driver_lat != null &&
      r.driver_lng != null
    ) {
      distanceMeters = haversineDistanceMeters(
        r.driver_lat,
        r.driver_lng,
        pickupLat,
        pickupLng
      );
    }

    let chainDistanceMeters: number | undefined;
    const chain = chainEnds.get(r.driver_id);
    if (chain && pickupLat != null && pickupLng != null) {
      chainDistanceMeters = haversineDistanceMeters(
        chain.lat,
        chain.lng,
        pickupLat,
        pickupLng
      );
    }

    return {
      applicationId: r.id,
      driverId: r.driver_id,
      rating: Number(d?.rating ?? 0),
      totalTrips: Number(d?.total_trips ?? 0),
      verified: Boolean(d?.verified),
      distanceFromPickupMeters: distanceMeters,
      chainDistanceMeters,
    };
  });

  // Filter candidates: minimum rating + valid documents
  const today = new Date().toISOString().slice(0, 10);
  const validCandidates: AssignmentCandidate[] = [];
  for (const c of candidates) {
    // Minimum rating filter (skip for drivers with no trips yet — rating defaults to 0)
    if (c.totalTrips > 0 && c.rating < MIN_DRIVER_RATING) continue;

    const { data: driver } = await admin
      .from("drivers")
      .select("license_expiry, insurance_expiry, vtv_expiry, verified")
      .eq("id", c.driverId)
      .single();

    if (!driver || !driver.verified) continue;
    if (driver.license_expiry && driver.license_expiry < today) continue;
    if (driver.insurance_expiry && driver.insurance_expiry < today) continue;
    if (driver.vtv_expiry && driver.vtv_expiry < today) continue;

    validCandidates.push(c);
  }

  if (validCandidates.length === 0) {
    return {
      ok: false,
      data: { status: 400, error: "No hay candidatos con documentación vigente y rating mínimo" },
    };
  }

  const winner = strategy.selectBest(validCandidates, {
    shipmentId,
    firstLegOriginLat: pickupLat,
    firstLegOriginLng: pickupLng,
  });

  if (!winner) {
    return {
      ok: false,
      data: { status: 500, error: "La estrategia no eligió candidato" },
    };
  }

  const { data: vehicleRow, error: vehError } = await admin
    .from("vehicles")
    .select("id")
    .eq("driver_id", winner.driverId)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (vehError) {
    return { ok: false, data: { status: 500, error: vehError.message } };
  }

  const vehicleId = vehicleRow?.id ?? null;

  // Backhaul auto-detection: if this pickup is within BACKHAUL_SEARCH_RADIUS_KM
  // of the driver's current active trip destination, mark as backhaul (reduced commission)
  let isBackhaul = false;
  const chainEnd = chainEnds.get(winner.driverId);
  if (chainEnd && pickupLat != null && pickupLng != null) {
    const chainDistKm = haversineDistanceMeters(chainEnd.lat, chainEnd.lng, pickupLat, pickupLng) / 1000;
    isBackhaul = chainDistKm <= BACKHAUL_SEARCH_RADIUS_KM;
  }

  const { error: upShip } = await admin
    .from("shipments")
    .update({
      driver_id: winner.driverId,
      vehicle_id: vehicleId,
      status: "accepted",
      assignment_strategy_id: strategy.id,
      is_backhaul: isBackhaul,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shipmentId)
    .is("driver_id", null);

  if (upShip) {
    return { ok: false, data: { status: 500, error: upShip.message } };
  }

  await admin
    .from("shipment_driver_applications")
    .update({ status: "selected" })
    .eq("id", winner.applicationId);

  await admin
    .from("shipment_driver_applications")
    .update({ status: "rejected" })
    .eq("shipment_id", shipmentId)
    .eq("status", "pending")
    .neq("id", winner.applicationId);

  return {
    ok: true,
    data: {
      shipmentId,
      selectedDriverId: winner.driverId,
      applicationId: winner.applicationId,
      strategyId: strategy.id,
      vehicleId,
    },
  };
}
