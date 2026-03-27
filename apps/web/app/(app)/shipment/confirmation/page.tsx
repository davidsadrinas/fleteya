"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { createEvent } from "ics";

function buildIcs(title: string, description: string, location: string) {
  const now = new Date();
  const start: [number, number, number, number, number] = [
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours() + 1,
    now.getMinutes(),
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
  const searchParams = useSearchParams();
  const shipmentId = searchParams.get("shipmentId") ?? "N/A";
  const price = Number(searchParams.get("price") ?? "0");
  const reservation = useMemo(() => shipmentId.slice(0, 8).toUpperCase(), [shipmentId]);
  const ics = useMemo(
    () =>
      buildIcs(
        `FleteYa #${reservation}`,
        `Reserva ${reservation} · Seguimiento en /tracking?shipmentId=${shipmentId}`,
        "AMBA, Argentina"
      ),
    [reservation, shipmentId]
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
        <div className="text-4xl mb-2">✅</div>
        <h1 className="text-lg font-display font-bold mb-1">Reserva confirmada</h1>
        <p className="text-sm text-fy-soft">Número de reserva: {reservation}</p>
        <p className="text-sm text-fy-soft mt-1">
          Total estimado: <span className="text-fy-text font-semibold">${price.toLocaleString("es-AR")}</span>
        </p>
      </div>

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
