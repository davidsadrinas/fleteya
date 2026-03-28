"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createEvent } from "ics";
import { createClient } from "@/lib/supabase-client";

type ShipmentSummary = {
  originAddress: string | null;
  destAddress: string | null;
  driverName: string | null;
  vehicle: string | null;
  plate: string | null;
  basePrice: number;
  finalPrice: number;
  discountPct: number;
};

function buildIcs(
  title: string,
  description: string,
  location: string,
  startDate: Date
) {
  const start: [number, number, number, number, number] = [
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    startDate.getDate(),
    startDate.getHours(),
    startDate.getMinutes(),
  ];
  const result = createEvent({
    title,
    description,
    location,
    start,
    duration: { hours: 2 },
  });
  return result.value ?? "";
}

function ShipmentConfirmationContent() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const shipmentId = searchParams.get("shipmentId") ?? "N/A";
  const priceFromUrl = Number(searchParams.get("price") ?? "0");
  const reservation = useMemo(() => shipmentId.slice(0, 8).toUpperCase(), [shipmentId]);
  const [summary, setSummary] = useState<ShipmentSummary>({
    originAddress: null,
    destAddress: null,
    driverName: null,
    vehicle: null,
    plate: null,
    basePrice: 0,
    finalPrice: priceFromUrl,
    discountPct: 0,
  });

  useEffect(() => {
    if (!shipmentId || shipmentId === "N/A") return;
    const load = async () => {
      const { data: shipment } = await supabase
        .from("shipments")
        .select("id,base_price,final_price,driver_id")
        .eq("id", shipmentId)
        .maybeSingle();
      const { data: legs } = await supabase
        .from("shipment_legs")
        .select("origin_address,dest_address")
        .eq("shipment_id", shipmentId)
        .order("leg_order", { ascending: true });

      const driverId = (shipment as { driver_id?: string | null } | null)?.driver_id ?? null;
      let driverName: string | null = null;
      let vehicle: string | null = null;
      let plate: string | null = null;
      if (driverId) {
        const { data: driver } = await supabase
          .from("drivers")
          .select("user_id")
          .eq("id", driverId)
          .maybeSingle();
        const driverUserId = (driver as { user_id?: string | null } | null)?.user_id ?? null;
        if (driverUserId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", driverUserId)
            .maybeSingle();
          driverName = (profile as { name?: string | null } | null)?.name ?? null;
        }
        const { data: activeVehicle } = await supabase
          .from("vehicles")
          .select("brand,model,plate")
          .eq("driver_id", driverId)
          .eq("active", true)
          .maybeSingle();
        const active = activeVehicle as
          | { brand?: string | null; model?: string | null; plate?: string | null }
          | null;
        if (active) {
          vehicle = [active.brand, active.model].filter(Boolean).join(" ").trim() || null;
          plate = active.plate ?? null;
        }
      }

      const basePrice = Number((shipment as { base_price?: number | null } | null)?.base_price ?? 0);
      const finalPrice = Number(
        (shipment as { final_price?: number | null } | null)?.final_price ?? priceFromUrl
      );
      const discountPct =
        basePrice > 0 ? Math.max(0, Math.round(((basePrice - finalPrice) / basePrice) * 100)) : 0;

      setSummary({
        originAddress: (legs?.[0] as { origin_address?: string | null } | undefined)?.origin_address ?? null,
        destAddress:
          (legs?.[legs.length - 1] as { dest_address?: string | null } | undefined)?.dest_address ??
          null,
        driverName,
        vehicle,
        plate,
        basePrice,
        finalPrice,
        discountPct,
      });
    };
    void load();
  }, [priceFromUrl, shipmentId, supabase]);

  const icsDescription = useMemo(() => {
    const lines = [
      `Reserva ${reservation}`,
      summary.driverName ? `Fletero: ${summary.driverName}` : "Fletero: asignación en curso",
      summary.vehicle ? `Vehículo: ${summary.vehicle}` : null,
      summary.plate ? `Patente: ${summary.plate}` : null,
      `Seguimiento: /tracking?shipmentId=${shipmentId}`,
    ].filter(Boolean);
    return lines.join(" · ");
  }, [reservation, shipmentId, summary.driverName, summary.plate, summary.vehicle]);

  const ics = useMemo(
    () =>
      buildIcs(
        `FleteYa #${reservation}`,
        icsDescription,
        summary.originAddress ?? "AMBA, Argentina",
        new Date(Date.now() + 60 * 60 * 1000)
      ),
    [icsDescription, reservation, summary.originAddress]
  );

  const downloadIcs = () => {
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fletaya-${reservation}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 sm:px-5 py-5 pb-10 max-w-lg mx-auto min-w-0">
      <div className="rounded-2xl border border-brand-teal/30 bg-brand-teal/10 p-5 text-center mb-4">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal/20 animate-pulse-slow">
          <span className="text-3xl text-brand-teal-light">✓</span>
        </div>
        <h1 className="text-lg font-display font-bold mb-1">Reserva confirmada</h1>
        <p className="text-sm text-fy-soft">Número de reserva: {reservation}</p>
        <p className="text-sm text-fy-soft mt-1">
          Total estimado:{" "}
          <span className="text-fy-text font-semibold">
            ${summary.finalPrice.toLocaleString("es-AR")}
          </span>
        </p>
      </div>

      <section className="rounded-xl border border-fy-border bg-brand-card/30 p-4 mb-4">
        <h2 className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wide mb-2">
          Resumen del viaje
        </h2>
        <ul className="text-sm text-fy-soft space-y-1.5 mb-4">
          <li>
            Retiro:{" "}
            <span className="text-fy-text">{summary.originAddress ?? "Dirección en confirmación"}</span>
          </li>
          <li>
            Entrega:{" "}
            <span className="text-fy-text">{summary.destAddress ?? "Dirección en confirmación"}</span>
          </li>
          <li>
            Fletero: <span className="text-fy-text">{summary.driverName ?? "Asignación en curso"}</span>
          </li>
          <li>
            Vehículo:{" "}
            <span className="text-fy-text">
              {summary.vehicle ?? "A definir"} {summary.plate ? `(${summary.plate})` : ""}
            </span>
          </li>
        </ul>

        <h3 className="text-xs font-heading font-bold text-brand-amber uppercase tracking-wide mb-2">
          Precio
        </h3>
        <ul className="text-sm text-fy-soft space-y-1">
          <li className="flex justify-between">
            <span>Base</span>
            <span className="text-fy-text">${summary.basePrice.toLocaleString("es-AR")}</span>
          </li>
          <li className="flex justify-between">
            <span>Descuento por encadenado</span>
            <span className="text-fy-text">{summary.discountPct}%</span>
          </li>
          <li className="flex justify-between font-semibold">
            <span>Total final</span>
            <span className="text-fy-text">${summary.finalPrice.toLocaleString("es-AR")}</span>
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-fy-border bg-brand-card/30 p-4 mb-4">
        <h2 className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wide mb-2">
          Notificaciones enviadas
        </h2>
        <ul className="text-sm text-fy-soft space-y-2">
          <li>Email al cliente: Enviado ✓</li>
          <li>Email al fletero: Enviado ✓</li>
        </ul>
      </section>

      <section className="rounded-xl border border-fy-border bg-brand-card/30 p-4 mb-4">
        <h2 className="text-xs font-heading font-bold text-brand-amber uppercase tracking-wide mb-2">
          Agregar al calendario
        </h2>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button className="rounded-lg border border-fy-border py-2 text-xs" onClick={downloadIcs}>
            Google Calendar
          </button>
          <button className="rounded-lg border border-fy-border py-2 text-xs" onClick={downloadIcs}>
            Apple Calendar
          </button>
          <button className="rounded-lg border border-fy-border py-2 text-xs" onClick={downloadIcs}>
            Outlook
          </button>
        </div>
        <pre className="text-[10px] overflow-auto rounded-md border border-fy-border p-2 text-fy-dim bg-fy-bg">
          {ics.slice(0, 600)}
        </pre>
      </section>

      <div className="flex gap-3">
        <Link
          href={`/tracking?shipmentId=${shipmentId}`}
          className="flex-1 rounded-xl bg-brand-coral text-brand-ink py-2.5 text-sm font-bold text-center"
        >
          Ver tracking
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 rounded-xl border border-fy-border py-2.5 text-sm font-semibold text-center"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default function ShipmentConfirmationPage() {
  return (
    <Suspense fallback={<div className="px-4 sm:px-5 py-5 text-fy-soft">Cargando confirmación…</div>}>
      <ShipmentConfirmationContent />
    </Suspense>
  );
}
