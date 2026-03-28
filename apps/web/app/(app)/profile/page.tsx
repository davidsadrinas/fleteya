/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useSession, useSupabaseQuery } from "@/lib/hooks";
import { documentUploadSchema } from "@/lib/schemas";

type ProfileRow = {
  id: string;
  name: string | null;
  role: "client" | "driver" | null;
  phone: string | null;
};

type DriverRow = {
  id: string;
  verified: boolean;
  rating: number;
  total_trips: number;
  dni_front_url: string | null;
  dni_back_url: string | null;
  selfie_url: string | null;
  license_url: string | null;
  license_expiry: string | null;
  insurance_url: string | null;
  insurance_expiry: string | null;
  vtv_url: string | null;
  vtv_expiry: string | null;
};

type VehicleRow = {
  id: string;
  type: string;
  brand: string;
  year: number;
  plate: string;
  active: boolean;
};

export default function ProfilePage() {
  const supabase = createClient();
  const { user } = useSession();
  const { data: profiles } = useSupabaseQuery<ProfileRow>(
    "profiles",
    user?.id ? { column: "id", value: user.id } : undefined,
    Boolean(user?.id)
  );
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const profile = profiles?.[0];
  const isDriver = profile?.role === "driver";

  useEffect(() => {
    if (!isDriver || !user?.id) return;
    (async () => {
      const { data: driverData } = await supabase
        .from("drivers")
        .select(
          "id,verified,rating,total_trips,dni_front_url,dni_back_url,selfie_url,license_url,license_expiry,insurance_url,insurance_expiry,vtv_url,vtv_expiry"
        )
        .eq("user_id", user.id)
        .maybeSingle();
      setDriver((driverData as DriverRow | null) ?? null);
      if (!(driverData as DriverRow | null)?.id) return;
      const { data: vehData } = await supabase
        .from("vehicles")
        .select("id,type,brand,year,plate,active")
        .eq("driver_id", (driverData as DriverRow).id);
      setVehicles((vehData as VehicleRow[] | null) ?? []);
    })();
  }, [isDriver, supabase, user?.id]);

  const docsCompleted = useMemo(() => {
    if (!driver) return 0;
    const docs = [
      driver.dni_front_url,
      driver.dni_back_url,
      driver.selfie_url,
      driver.license_url,
      driver.insurance_url,
      driver.vtv_url,
    ];
    return docs.filter(Boolean).length;
  }, [driver]);

  const uploadDoc = async (
    field:
      | "dni_front_url"
      | "dni_back_url"
      | "selfie_url"
      | "license_url"
      | "insurance_url"
      | "vtv_url",
    file?: File | null
  ) => {
    if (!file) return;
    const parsed = documentUploadSchema.safeParse({
      documentType:
        field === "dni_front_url"
          ? "dni_front"
          : field === "dni_back_url"
          ? "dni_back"
          : field === "selfie_url"
          ? "selfie"
          : field === "license_url"
          ? "license"
          : field === "insurance_url"
          ? "insurance"
          : "vtv",
      fileType: file.type as "image/jpeg" | "image/png" | "application/pdf",
      fileSize: file.size,
    });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Archivo inválido.");
      return;
    }

    if (!user?.id) return;
    const path = `${user.id}/${field}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("dni-documents").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (upErr) {
      setMessage(upErr.message);
      return;
    }
    const res = await fetch("/api/drivers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value: path }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? "No se pudo actualizar el documento.");
      return;
    }
    setMessage("Documento actualizado.");
    const { data: driverData } = await supabase
      .from("drivers")
      .select(
        "id,verified,rating,total_trips,dni_front_url,dni_back_url,selfie_url,license_url,license_expiry,insurance_url,insurance_expiry,vtv_url,vtv_expiry"
      )
      .eq("user_id", user.id)
      .maybeSingle();
    setDriver((driverData as DriverRow | null) ?? null);
  };

  const setActiveVehicle = async (vehicleId: string) => {
    if (!driver?.id) return;
    await supabase.rpc("set_active_vehicle", {
      p_driver_id: driver.id,
      p_vehicle_id: vehicleId,
    });
    const { data } = await supabase
      .from("vehicles")
      .select("id,type,brand,year,plate,active")
      .eq("driver_id", driver.id);
    setVehicles((data as VehicleRow[] | null) ?? []);
  };

  return (
    <div className="px-4 sm:px-5 py-5 pb-10 max-w-lg mx-auto min-w-0">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">◉</div>
        <h2 className="text-lg font-display font-bold mb-2">Mi perfil</h2>
        <p className="text-fy-dim text-sm leading-relaxed">
          Un solo lugar para tus datos personales, historial y documentación.
        </p>
      </div>

      <section className="mb-5 rounded-2xl border border-fy-border bg-brand-card/40 p-4">
        <h3 className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wide mb-3">
          Cuenta
        </h3>
        <ul className="text-sm text-fy-soft space-y-2">
          <li>• Nombre: <span className="text-fy-text">{profile?.name ?? "Sin completar"}</span></li>
          <li>• Email: <span className="text-fy-text">{user?.email ?? "-"}</span></li>
          <li>• Teléfono: <span className="text-fy-text">{profile?.phone ?? "Sin completar"}</span></li>
          <li>• Rol: <span className="text-fy-text">{profile?.role ?? "Sin definir"}</span></li>
        </ul>
      </section>

      {isDriver ? (
        <section className="mb-6 rounded-2xl border border-fy-border bg-brand-card/40 p-4">
          <h3 className="text-xs font-heading font-bold text-brand-amber uppercase tracking-wide mb-3">
            Fletero
          </h3>
          <p className="text-xs text-fy-soft mb-3">
            Rating {driver?.rating ?? 0} · Viajes {driver?.total_trips ?? 0} · Documentos {docsCompleted}/6
          </p>
          {docsCompleted < 6 ? (
            <p className="text-xs text-brand-amber mb-3">
              No podés recibir viajes hasta completar la documentación obligatoria.
            </p>
          ) : null}
          <div className="space-y-3">
            {[
              { field: "dni_front_url", label: "DNI" },
              { field: "dni_back_url", label: "DNI dorso" },
              { field: "selfie_url", label: "Selfie validación" },
              { field: "license_url", label: "Licencia" },
              { field: "insurance_url", label: "Seguro" },
              { field: "vtv_url", label: "VTV/RTO" },
            ].map((doc) => (
              <label key={doc.field} className="block rounded-lg border border-fy-border p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span>{doc.label}</span>
                  <span className="text-xs text-fy-dim">
                    {(driver as Record<string, unknown> | null)?.[doc.field] ? "✓ Cargado" : "Subir"}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="text-xs"
                  onChange={(e) =>
                    void uploadDoc(
                      doc.field as
                        | "dni_front_url"
                        | "dni_back_url"
                        | "selfie_url"
                        | "license_url"
                        | "insurance_url"
                        | "vtv_url",
                      e.target.files?.[0] ?? null
                    )
                  }
                />
                {doc.field === "license_url" && driver?.license_expiry ? (
                  <p className="mt-1 text-[11px] text-fy-dim">Vence: {driver.license_expiry}</p>
                ) : null}
                {doc.field === "insurance_url" && driver?.insurance_expiry ? (
                  <p className="mt-1 text-[11px] text-fy-dim">Vence: {driver.insurance_expiry}</p>
                ) : null}
                {doc.field === "vtv_url" && driver?.vtv_expiry ? (
                  <p className="mt-1 text-[11px] text-fy-dim">Vence: {driver.vtv_expiry}</p>
                ) : null}
              </label>
            ))}
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold mb-2">Mis vehículos</p>
            <div className="space-y-2">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`w-full rounded-lg border p-3 text-left ${
                    v.active ? "border-brand-teal-light bg-brand-teal/10" : "border-fy-border"
                  }`}
                  onClick={() => void setActiveVehicle(v.id)}
                >
                  <p className="text-sm font-semibold text-fy-text">
                    {v.brand} · {v.plate}
                  </p>
                  <p className="text-xs text-fy-dim">
                    {v.type} · {v.year} {v.active ? "· Activo" : ""}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {message ? (
        <p className="mb-4 rounded-md border border-brand-teal/30 bg-brand-teal/10 px-3 py-2 text-xs text-brand-teal-light">
          {message}
        </p>
      ) : null}

      <Link
        href="/settings"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-fy-border text-sm font-semibold text-fy-text hover:bg-brand-surface/50 transition-colors"
      >
        ⚙️ Configuración de cuenta
      </Link>
    </div>
  );
}
