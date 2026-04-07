interface ListShipmentsInput {
  supabase: any;
  userId: string;
  status?: string | null;
  view?: string | null;
}

interface ListShipmentsOutput {
  shipments: unknown[];
}

export async function listShipmentsForUser(input: ListShipmentsInput): Promise<ListShipmentsOutput> {
  const { supabase, userId, status, view } = input;

  let query = supabase
    .from("shipments")
    .select("*, shipment_legs(*), payments(*)")
    .order("created_at", { ascending: false });

  const { data: driverRow, error: driverLookupError } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (driverLookupError) {
    throw new Error(driverLookupError.message);
  }

  if (driverRow?.id) {
    if (view === "open") query = query.is("driver_id", null).eq("status", "pending");
    else query = query.eq("driver_id", driverRow.id);
  } else {
    query = query.eq("client_id", userId);
  }

  if (status) query = query.eq("status", status);

  const { data, error } = await query.limit(20);
  if (error) throw new Error(error.message);
  return { shipments: data ?? [] };
}
