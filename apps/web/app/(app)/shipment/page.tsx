/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useShipmentWizard } from "@/lib/stores";
import { createShipmentSchema } from "@/lib/schemas";

type WizardStep = 0 | 1 | 2 | 3;

const STEP_TITLES = ["Ruta", "Carga", "Asignación", "Confirmar"];

export default function ShipmentPage() {
  const router = useRouter();
  const { step, setStep, data, updateData, addLeg, removeLeg, updateLeg, reset } = useShipmentWizard();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acarreoReason, setAcarreoReason] = useState("averia");

  const currentStep = (step > 3 ? 3 : step) as WizardStep;
  const progressPct = ((currentStep + 1) / 4) * 100;

  const legsPayload = useMemo(
    () =>
      data.legs
        .filter((leg) => leg.from && leg.to && leg.fromCoords && leg.toCoords)
        .map((leg) => ({
          originAddress: leg.from,
          originLat: leg.fromCoords!.lat,
          originLng: leg.fromCoords!.lng,
          destAddress: leg.to,
          destLat: leg.toCoords!.lat,
          destLng: leg.toCoords!.lng,
        })),
    [data.legs]
  );

  const estimatedBase = useMemo(() => {
    const km = legsPayload.length * 8;
    return Math.max(6000, 3200 + km * 1800);
  }, [legsPayload.length]);
  const estimatedDiscount = legsPayload.length > 1 ? Math.min((legsPayload.length - 1) * 12, 45) : 0;
  const estimatedFinal = Math.round(estimatedBase * (1 - estimatedDiscount / 100));

  const goNext = () => setStep(Math.min(currentStep + 1, 3));
  const goBack = () => setStep(Math.max(currentStep - 1, 0));

  const confirmAndPay = async () => {
    setError(null);
    const payload = {
      type: (data.type || "mudanza") as
        | "mudanza"
        | "mercaderia"
        | "materiales"
        | "electrodomesticos"
        | "muebles"
        | "acarreo_vehiculo"
        | "limpieza_atmosferico"
        | "residuos",
      description: data.description || undefined,
      weight: (data.weight || "medium") as "light" | "medium" | "heavy" | "xheavy",
      helpers: data.helpers,
      vehicleType: (data.vehicleType || "camioneta") as
        | "moto"
        | "utilitario"
        | "camioneta"
        | "camion"
        | "grua"
        | "atmosferico",
      scheduledAt:
        data.when === "Ahora"
          ? new Date().toISOString()
          : data.when === "Hoy"
          ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      legs: legsPayload,
    };
    const parsed = createShipmentSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Completá origen/destino y los datos de carga para continuar.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo crear el envío.");
      reset();
      router.push(
        `/shipment/confirmation?shipmentId=${json.shipment.id}&price=${json.shipment.final_price ?? estimatedFinal}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el envío.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 sm:px-5 py-5 pb-10 max-w-lg mx-auto min-w-0">
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] text-fy-dim mb-2">
          <span>Paso {currentStep + 1} de 4</span>
          <span>{STEP_TITLES[currentStep]}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-brand-surface overflow-hidden">
          <div className="h-full bg-brand-coral transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <h2 className="text-lg font-display font-bold mb-3">Nuevo envío</h2>

      {currentStep === 0 ? (
        <section className="space-y-3">
          {data.legs.map((leg, i) => (
            <div key={i} className="rounded-xl border border-fy-border bg-brand-card/40 p-3 space-y-2">
              <p className="text-xs text-fy-dim uppercase tracking-wide">Tramo {i + 1}</p>
              <input
                className="input"
                placeholder="Origen"
                value={leg.from}
                onChange={(e) =>
                  updateLeg(i, "from", e.target.value, {
                    lat: -34.6037 + i * 0.01,
                    lng: -58.3816 + i * 0.01,
                  })
                }
              />
              <input
                className="input"
                placeholder="Destino"
                value={leg.to}
                onChange={(e) =>
                  updateLeg(i, "to", e.target.value, {
                    lat: -34.6237 + i * 0.01,
                    lng: -58.4016 + i * 0.01,
                  })
                }
              />
              {i > 0 ? (
                <button
                  type="button"
                  className="text-xs text-brand-error"
                  onClick={() => removeLeg(i)}
                >
                  Eliminar tramo
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={() => data.legs.length < 5 && addLeg()}
            className="w-full rounded-lg border border-dashed border-fy-border px-3 py-2 text-sm text-fy-soft"
          >
            + Agregar tramo
          </button>
        </section>
      ) : null}

      {currentStep === 1 ? (
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              "mudanza",
              "mercaderia",
              "materiales",
              "electrodomesticos",
              "muebles",
              "acarreo_vehiculo",
              "limpieza_atmosferico",
              "residuos",
            ].map((option) => (
              <button
                key={option}
                type="button"
                className={`rounded-lg border px-2 py-2 text-xs font-semibold capitalize ${
                  (data.type || "mudanza") === option
                    ? "border-brand-teal-light bg-brand-teal/10 text-brand-teal-light"
                    : "border-fy-border text-fy-soft"
                }`}
                onClick={() => updateData({ type: option })}
              >
                {option.replaceAll("_", " ")}
              </button>
            ))}
          </div>
          <textarea
            className="input min-h-24"
            placeholder="Descripción de la carga"
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
          />
          {(data.type || "mudanza") === "acarreo_vehiculo" ? (
            <div className="rounded-lg border border-fy-border bg-brand-card/40 p-3">
              <p className="text-xs font-semibold text-fy-text mb-2">Detalle de acarreo</p>
              <select
                className="input"
                value={acarreoReason}
                onChange={(e) => setAcarreoReason(e.target.value)}
              >
                <option value="averia">Avería</option>
                <option value="compraventa">Compraventa</option>
                <option value="traslado">Traslado</option>
                <option value="otro">Otro</option>
              </select>
              <p className="text-[11px] text-fy-dim mt-2">
                Motivo seleccionado: {acarreoReason}. El fletero verá este contexto en la postulación.
              </p>
            </div>
          ) : null}
          {(data.type || "mudanza") === "limpieza_atmosferico" ||
          (data.type || "mudanza") === "residuos" ? (
            <p className="rounded-lg border border-brand-amber/30 bg-brand-amber/10 px-3 py-2 text-xs text-brand-amber">
              Para este servicio puede requerirse certificación específica y validación documental del fletero.
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <select
              className="input"
              value={data.weight || "medium"}
              onChange={(e) => updateData({ weight: e.target.value })}
            >
              <option value="light">Hasta 20kg</option>
              <option value="medium">20-200kg</option>
              <option value="heavy">200-1500kg</option>
              <option value="xheavy">+1500kg</option>
            </select>
            <select
              className="input"
              value={data.vehicleType || "camioneta"}
              onChange={(e) => updateData({ vehicleType: e.target.value })}
            >
              <option value="moto">Moto</option>
              <option value="utilitario">Utilitario</option>
              <option value="camioneta">Camioneta</option>
              <option value="camion">Camión</option>
              <option value="grua">Grúa</option>
              <option value="atmosferico">Atmosférico</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-fy-dim mb-2">Ayudantes</p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => updateData({ helpers: count })}
                  className={`rounded-lg border py-2 text-sm font-semibold ${
                    (data.helpers ?? 0) === count
                      ? "border-brand-teal-light bg-brand-teal/10 text-brand-teal-light"
                      : "border-fy-border text-fy-soft"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-fy-dim mb-2">Cuándo retirar</p>
            <div className="grid grid-cols-3 gap-2">
              {["Ahora", "Hoy", "Programar"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateData({ when: option })}
                  className={`rounded-lg border py-2 text-xs font-semibold ${
                    (data.when || "Hoy") === option
                      ? "border-brand-teal-light bg-brand-teal/10 text-brand-teal-light"
                      : "border-fy-border text-fy-soft"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {currentStep === 2 ? (
        <section className="rounded-2xl border border-brand-teal/25 bg-brand-teal/5 p-4">
          <h3 className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wide mb-2">
            Buscamos un fletero
          </h3>
          <p className="text-sm text-fy-soft leading-relaxed">
            Los conductores postulan con su ubicación. La plataforma asigna on-demand por bandas de cercanía y valoración.
          </p>
          <p className="text-xs text-fy-dim mt-3">Estado: esperando postulación/assign automático.</p>
        </section>
      ) : null}

      {currentStep === 3 ? (
        <section className="space-y-3 rounded-xl border border-fy-border bg-brand-card/40 p-4">
          <p className="text-sm font-semibold text-fy-text">Resumen</p>
          <p className="text-xs text-fy-soft">Tramos: {legsPayload.length}</p>
          <p className="text-xs text-fy-soft">Retiro: {data.when || "Hoy"}</p>
          <p className="text-xs text-fy-soft">
            Precio estimado:{" "}
            {estimatedDiscount > 0 ? (
              <>
                <span className="line-through opacity-60 mr-1">${estimatedBase.toLocaleString("es-AR")}</span>
                <span className="text-brand-teal-light">${estimatedFinal.toLocaleString("es-AR")}</span>
              </>
            ) : (
              <span>${estimatedFinal.toLocaleString("es-AR")}</span>
            )}
          </p>
          <p className="text-xs text-fy-dim">Comisión base plataforma: 22%.</p>
        </section>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-brand-error rounded-lg border border-brand-error/40 bg-brand-error/10 px-3 py-2">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 0}
          className="flex-1 rounded-xl border border-fy-border py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          ← Atrás
        </button>
        {currentStep < 3 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex-1 rounded-xl bg-brand-coral text-brand-ink py-2.5 text-sm font-bold"
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void confirmAndPay()}
            disabled={saving}
            className="flex-1 rounded-xl bg-brand-coral text-brand-ink py-2.5 text-sm font-bold disabled:opacity-50"
          >
            {saving ? "Confirmando..." : "Confirmar y pagar"}
          </button>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link href="/dashboard" className="text-sm font-semibold text-brand-teal-light hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
