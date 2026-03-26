"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useSession } from "@/lib/hooks";
import { createVehicleSchema, onboardingSchema } from "@/lib/schemas";
import { shouldRedirectToOnboarding } from "@/lib/onboarding/status";
import { useAuthStore } from "@/lib/stores";

const VEHICLE_TYPES = [
  { value: "moto", label: "Moto" },
  { value: "utilitario", label: "Utilitario" },
  { value: "camioneta", label: "Camioneta" },
  { value: "camion", label: "Camión" },
  { value: "grua", label: "Grúa" },
  { value: "atmosferico", label: "Atmosférico" },
] as const;

type VehicleTypeValue = (typeof VEHICLE_TYPES)[number]["value"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const setUser = useAuthStore((s) => s.setUser);
  const storeUser = useAuthStore((s) => s.user);

  const [step, setStep] = useState<1 | 2>(1);
  const [roleChoice, setRoleChoice] = useState<"client" | "driver" | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [vehicleType, setVehicleType] = useState<VehicleTypeValue>("camioneta");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [plate, setPlate] = useState("");
  const nameSeededFromStore = useRef(false);

  useEffect(() => {
    if (nameSeededFromStore.current || !storeUser?.name) return;
    setName(storeUser.name);
    nameSeededFromStore.current = true;
  }, [storeUser?.name]);

  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, role")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled || !profile) return;

      let driverId: string | null = null;
      if (profile.role === "driver") {
        const { data: driverRow } = await supabase
          .from("drivers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        driverId = driverRow?.id ?? null;
      }

      if (
        !shouldRedirectToOnboarding(
          { phone: profile.phone, role: profile.role },
          driverId
        )
      ) {
        router.replace("/dashboard");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, router]);

  const syncStore = (next: { name: string; phone: string; role: string }) => {
    const prev = useAuthStore.getState().user;
    if (prev) {
      setUser({ ...prev, name: next.name, phone: next.phone, role: next.role });
    }
  };

  const persistClient = async (data: {
    name: string;
    phone: string;
    role: "client" | "driver";
  }) => {
    if (!user) return;
    setSubmitting(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        name: data.name,
        phone: data.phone,
        role: data.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSubmitting(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    syncStore(data);
    router.replace("/dashboard");
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!roleChoice) {
      setMessage("Elegí si necesitás un flete o si sos fletero.");
      return;
    }

    const parsed = onboardingSchema.safeParse({
      name: name.trim(),
      phone: phone.trim(),
      role: roleChoice,
    });

    if (!parsed.success) {
      const err = parsed.error.flatten().fieldErrors;
      setMessage(
        err.name?.[0] ?? err.phone?.[0] ?? err.role?.[0] ?? "Revisá los datos."
      );
      return;
    }

    if (parsed.data.role === "client") {
      await persistClient(parsed.data);
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!user) return;

    const oParsed = onboardingSchema.safeParse({
      name: name.trim(),
      phone: phone.trim(),
      role: "driver" as const,
    });
    const yearNum = Number.parseInt(year, 10);
    const vParsed = createVehicleSchema.safeParse({
      type: vehicleType,
      brand: brand.trim(),
      model: model.trim(),
      year: yearNum,
      plate: plate.trim().toUpperCase(),
    });

    if (!oParsed.success) {
      const err = oParsed.error.flatten().fieldErrors;
      setMessage(err.name?.[0] ?? err.phone?.[0] ?? "Revisá tus datos personales.");
      return;
    }
    if (!vParsed.success) {
      const err = vParsed.error.flatten().fieldErrors;
      setMessage(
        err.type?.[0] ??
          err.brand?.[0] ??
          err.year?.[0] ??
          err.plate?.[0] ??
          "Revisá los datos del vehículo."
      );
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: oParsed.data.name,
        phone: oParsed.data.phone,
        role: "driver",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      setSubmitting(false);
      setMessage(profileError.message);
      return;
    }

    const { data: driverRow, error: driverError } = await supabase
      .from("drivers")
      .insert({ user_id: user.id })
      .select("id")
      .single();

    if (driverError || !driverRow) {
      setSubmitting(false);
      setMessage(driverError?.message ?? "No pudimos crear tu perfil de fletero.");
      return;
    }

    const { error: vehicleError } = await supabase.from("vehicles").insert({
      driver_id: driverRow.id,
      type: vParsed.data.type,
      brand: vParsed.data.brand,
      model: vParsed.data.model,
      year: vParsed.data.year,
      plate: vParsed.data.plate,
      active: true,
    });

    setSubmitting(false);
    if (vehicleError) {
      setMessage(vehicleError.message);
      return;
    }

    syncStore({
      name: oParsed.data.name,
      phone: oParsed.data.phone,
      role: "driver",
    });
    router.replace("/dashboard");
  };

  if (loading || !user) {
    return (
      <div className="min-h-dvh min-h-[100dvh] bg-fy-bg flex items-center justify-center text-fy-soft">
        Cargando…
      </div>
    );
  }

  return (
    <div className="min-h-dvh min-h-[100dvh] bg-fy-bg flex flex-col items-center px-4 sm:px-6 py-10 sm:py-12 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md min-w-0">
        <Link href="/" className="inline-flex items-center gap-1 mb-8">
          <span className="text-2xl font-display font-extrabold text-fy-text">flete</span>
          <span className="text-2xl font-display font-extrabold text-brand-amber">ya</span>
        </Link>

        <h1 className="text-2xl font-display font-bold text-fy-text mb-1">
          {step === 1 ? "Completá tu perfil" : "Tu primer vehículo"}
        </h1>
        <p className="text-fy-soft text-sm mb-8 leading-relaxed">
          {step === 1
            ? "Clientes publican envíos y ven el estado “esperando asignación”. Fleteros: después vas a poder postularte a cargas; tu reputación y ubicación cuentan para la asignación."
            : "Con la unidad cargada podés recibir asignaciones alineadas al tipo de vehículo y a la documentación que vayas completando en perfil."}
        </p>

        {message && (
          <div
            className="mb-6 rounded-md border border-brand-error/40 bg-brand-error/10 px-4 py-3 text-sm text-brand-error"
            role="alert"
          >
            {message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-medium text-fy-soft uppercase tracking-wide">
                ¿Cómo vas a usar FleteYa?
              </p>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setRoleChoice("client")}
                  className={`rounded-lg border px-4 py-4 text-left text-sm font-semibold transition-colors ${
                    roleChoice === "client"
                      ? "border-brand-teal bg-brand-teal/15 text-brand-teal-light"
                      : "border-fy-border bg-brand-surface/80 text-fy-text hover:bg-white/5"
                  }`}
                >
                  Necesito un flete
                  <span className="block mt-1 text-xs font-normal text-fy-dim">
                    Busco mudanzas, acarreos o cargas
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleChoice("driver")}
                  className={`rounded-lg border px-4 py-4 text-left text-sm font-semibold transition-colors ${
                    roleChoice === "driver"
                      ? "border-brand-teal bg-brand-teal/15 text-brand-teal-light"
                      : "border-fy-border bg-brand-surface/80 text-fy-text hover:bg-white/5"
                  }`}
                >
                  Soy fletero
                  <span className="block mt-1 text-xs font-normal text-fy-dim">
                    Ofrezco mi camioneta o camión
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="onb-name" className="block text-xs font-medium text-fy-soft mb-1.5">
                Nombre completo
              </label>
              <input
                id="onb-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label htmlFor="onb-phone" className="block text-xs font-medium text-fy-soft mb-1.5">
                Teléfono (Argentina)
              </label>
              <input
                id="onb-phone"
                type="tel"
                className="input"
                placeholder="Ej. 11 2345-6789 o +54 9 11 2345‑6789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                required
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
              {submitting ? "Guardando…" : roleChoice === "driver" ? "Siguiente" : "Entrar a FleteYa"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div>
              <label htmlFor="veh-type" className="block text-xs font-medium text-fy-soft mb-1.5">
                Tipo de unidad
              </label>
              <select
                id="veh-type"
                className="input"
                value={vehicleType}
                onChange={(e) =>
                  setVehicleType(e.target.value as VehicleTypeValue)
                }
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="veh-brand" className="block text-xs font-medium text-fy-soft mb-1.5">
                  Marca
                </label>
                <input
                  id="veh-brand"
                  className="input"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="veh-model" className="block text-xs font-medium text-fy-soft mb-1.5">
                  Modelo
                </label>
                <input
                  id="veh-model"
                  className="input"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="veh-year" className="block text-xs font-medium text-fy-soft mb-1.5">
                  Año
                </label>
                <input
                  id="veh-year"
                  type="number"
                  className="input"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="veh-plate" className="block text-xs font-medium text-fy-soft mb-1.5">
                  Patente
                </label>
                <input
                  id="veh-plate"
                  className="input uppercase"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                className="flex-1 rounded-md border border-fy-border py-3 text-sm font-semibold text-fy-text hover:bg-white/5"
                onClick={() => setStep(1)}
                disabled={submitting}
              >
                Atrás
              </button>
              <button type="submit" disabled={submitting} className="btn-primary flex-[2] justify-center">
                {submitting ? "Guardando…" : "Entrar a FleteYa"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
