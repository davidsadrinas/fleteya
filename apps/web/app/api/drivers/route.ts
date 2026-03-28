import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { enforceRateLimit, getRequesterIp } from "@/lib/rate-limit";

type VehicleRow = {
  id: string;
  type: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  active: boolean | null;
  hazmat_cert_url: string | null;
  towing_license_url: string | null;
};

type DriverQueryRow = {
  id: string;
  rating: number;
  total_trips: number;
  verified: boolean;
  dni_verified: boolean;
  profiles: { name: string | null; avatar_url: string | null; phone: string | null };
  vehicles: VehicleRow[];
};

export async function GET(req: NextRequest) {
  const ip = getRequesterIp(req.headers);
  const rate = await enforceRateLimit({ key: `drivers:get:${ip}`, max: 30, windowMs: 60_000 });
  if (!rate.ok) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  const supabase = createServerSupabase();
  const { searchParams } = new URL(req.url);
  const vehicleType = searchParams.get("vehicleType");

  let query = supabase
    .from("drivers")
    .select("*, vehicles(*), profiles!inner(name, avatar_url, phone)")
    .eq("verified", true);

  if (vehicleType) {
    query = query.contains("vehicles", [{ type: vehicleType, active: true }]);
  }

  const { data, error } = await query.order("rating", { ascending: false }).limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Format response
  const rows = (data as DriverQueryRow[] | null) ?? [];
  const drivers = rows.map((d) => ({
    id: d.id,
    name: d.profiles.name,
    avatarUrl: d.profiles.avatar_url,
    rating: d.rating,
    totalTrips: d.total_trips,
    verified: d.verified,
    dniVerified: d.dni_verified,
    vehicles: d.vehicles.map((v) => ({
      id: v.id,
      type: v.type,
      brand: v.brand,
      model: v.model,
      year: v.year,
      plate: v.plate,
      active: v.active,
      hasHazmatCert: !!v.hazmat_cert_url,
      hasTowingLicense: !!v.towing_license_url,
    })),
    activeVehicle: d.vehicles.find((v) => v.active) || null,
  }));

  return NextResponse.json({ drivers });
}

// Update driver verification status (upload doc)
export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { field, value } = body;

  const allowedFields = [
    "dni_front_url", "dni_back_url", "selfie_url",
    "license_url", "license_expiry",
    "insurance_url", "insurance_expiry",
    "vtv_url", "vtv_expiry",
  ];

  if (!allowedFields.includes(field)) {
    return NextResponse.json({ error: "Campo no permitido" }, { status: 400 });
  }

  const { error } = await supabase
    .from("drivers")
    .update({ [field]: value })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // DNI verification is handled by admin panel (POST /api/admin/drivers/[id]/verify)
  // Documents are uploaded here; admin reviews and approves via the admin panel.

  return NextResponse.json({ success: true });
}
