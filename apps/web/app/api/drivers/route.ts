import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { searchParams } = new URL(req.url);
  const vehicleType = searchParams.get("vehicleType");
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radiusKm = parseInt(searchParams.get("radius") || "15");

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
  const drivers = (data || []).map((d: any) => ({
    id: d.id,
    name: d.profiles.name,
    avatarUrl: d.profiles.avatar_url,
    rating: d.rating,
    totalTrips: d.total_trips,
    verified: d.verified,
    dniVerified: d.dni_verified,
    vehicles: d.vehicles.map((v: any) => ({
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
    activeVehicle: d.vehicles.find((v: any) => v.active) || null,
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

  // Check if all docs are uploaded -> auto-verify DNI
  if (["dni_front_url", "dni_back_url", "selfie_url"].includes(field)) {
    const { data: driver } = await supabase
      .from("drivers")
      .select("dni_front_url, dni_back_url, selfie_url")
      .eq("user_id", user.id)
      .single();

    if (driver?.dni_front_url && driver?.dni_back_url && driver?.selfie_url) {
      await supabase.from("drivers").update({ dni_verified: true }).eq("user_id", user.id);
    }
  }

  return NextResponse.json({ success: true });
}
