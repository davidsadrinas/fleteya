import type { SupabaseClient } from "@supabase/supabase-js";

type ShipmentAccess = {
  allowed: boolean;
  driverUserId: string | null;
};

export async function canAccessShipment(
  supabase: SupabaseClient,
  shipmentId: string,
  userId: string
): Promise<ShipmentAccess> {
  const { data: shipment, error } = await supabase
    .from("shipments")
    .select("id,client_id,driver_id")
    .eq("id", shipmentId)
    .maybeSingle();
  if (error || !shipment) return { allowed: false, driverUserId: null };

  if (shipment.client_id === userId) {
    return { allowed: true, driverUserId: null };
  }

  if (!shipment.driver_id) {
    return { allowed: false, driverUserId: null };
  }

  const { data: driverRow } = await supabase
    .from("drivers")
    .select("user_id")
    .eq("id", shipment.driver_id)
    .maybeSingle();

  const driverUserId = driverRow?.user_id ?? null;
  return { allowed: driverUserId === userId, driverUserId };
}
