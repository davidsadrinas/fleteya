/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSession, useSupabaseQuery } from "@/lib/hooks";

type ProfileRow = { id: string; name: string | null };
type ShipmentRow = {
  id: string;
  status: string;
  type: string | null;
  final_price: number | null;
  is_backhaul: boolean | null;
  created_at: string;
};

export default function DashboardPage() {
  const { user } = useSession();
  const { data: profiles } = useSupabaseQuery<ProfileRow>(
    "profiles",
    user?.id ? { column: "id", value: user.id } : undefined,
    Boolean(user?.id)
  );
  const { data: shipments } = useSupabaseQuery<ShipmentRow>(
    "shipments",
    user?.id ? { column: "client_id", value: user.id } : undefined,
    Boolean(user?.id)
  );

  const profileName = profiles?.[0]?.name?.trim() || user?.email?.split("@")[0] || "Hola";
  const activeShipment = (shipments ?? []).find(
    (s) => s.status !== "delivered" && s.status !== "cancelled"
  );
  const backhaulTrips = useMemo(
    () =>
      (shipments ?? [])
        .filter((s) => s.is_backhaul)
        .slice(0, 3)
        .map((s) => ({
          id: s.id,
          from: "Origen",
          to: "Destino",
          price: Number(s.final_price ?? 0).toLocaleString("es-AR"),
          time: new Date(s.created_at).toLocaleString("es-AR"),
          space: "50",
          note: "En vivo",
        })),
    [shipments]
  );

  return (
    <div className="px-4 sm:px-5 py-5 pb-8 max-w-full min-w-0">
      <div className="mb-6">
        <h2 className="text-xl font-display font-bold mb-1">Hola, {profileName} 👋</h2>
        <p className="text-fy-soft text-sm leading-relaxed">
          Desde acá publicás cargas, ves el estado de asignación y entrás al seguimiento cuando tu flete esté en curso.
        </p>
      </div>

      <section className="mb-6 rounded-2xl border border-fy-border bg-brand-card/50 p-4">
        <h3 className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wide mb-3">
          Cómo funciona tu pedido
        </h3>
        <ol className="space-y-3 text-sm text-fy-soft">
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-brand-teal/20 text-brand-teal-light text-xs font-bold flex items-center justify-center">
              1
            </span>
            <span>
              <strong className="text-fy-text">Nuevo envío:</strong> cargás ruta, tipo de carga y detalles. Podés sumar tramos para mejorar el precio por kilómetro.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-brand-teal/20 text-brand-teal-light text-xs font-bold flex items-center justify-center">
              2
            </span>
            <span>
              <strong className="text-fy-text">Esperando asignación:</strong> los fleteros se postulan. La app asigna on-demand por cercanía (incluido quien termina otro viaje cerca de tu retiro) y reputación.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-brand-teal/20 text-brand-teal-light text-xs font-bold flex items-center justify-center">
              3
            </span>
            <span>
              <strong className="text-fy-text">Confirmación y pago:</strong> precio cerrado con MercadoPago; después tracking en vivo hasta la entrega.
            </span>
          </li>
        </ol>
      </section>

      <section className="mb-6">
        <h3 className="text-sm font-display font-bold mb-3">Tipos de servicio</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { icon: "📦", title: "Flete", copy: "Mudanzas y mercadería general." },
            { icon: "🚚", title: "Acarreo", copy: "Traslado de vehículo y cargas especiales." },
            { icon: "🧪", title: "Atmosférico", copy: "Servicios específicos y residuos." },
          ].map((service) => (
            <div key={service.title} className="rounded-xl border border-fy-border bg-brand-card/40 p-3">
              <p className="text-lg mb-1">{service.icon}</p>
              <p className="text-sm font-semibold text-fy-text">{service.title}</p>
              <p className="text-[11px] text-fy-dim mt-1 leading-relaxed">{service.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <Link
        href="/shipment"
        className="block w-full p-5 rounded-2xl bg-gradient-to-r from-brand-teal to-brand-teal-light mb-4 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="text-xs font-semibold text-brand-ink/60 tracking-wider uppercase mb-1">
            Nuevo envío
          </div>
          <div className="text-lg font-display font-bold text-brand-ink">
            Publicá una carga
          </div>
          <div className="text-xs text-brand-ink/55 mt-1 leading-relaxed">
            Wizard: ruta → carga → estado de asignación → pago. Sin elegir fletero manualmente.
          </div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl opacity-20">
          📦
        </div>
      </Link>

      <Link
        href={activeShipment?.id ? `/tracking?shipmentId=${activeShipment.id}` : "/tracking"}
        className="flex items-center gap-3 p-4 rounded-xl bg-brand-card border border-brand-teal/25 mb-2"
      >
        <div className="w-10 h-10 rounded-xl bg-brand-teal/15 flex items-center justify-center text-xl">
          📍
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold text-fy-text">Tracking en vivo</div>
          <div className="text-xs text-fy-dim mt-0.5 leading-relaxed">
            {activeShipment
              ? `Viaje activo: ${activeShipment.type ?? "envío"} · estado ${activeShipment.status}`
              : "Todavía no tenés viajes activos."}
          </div>
        </div>
        <span className="text-brand-teal-light">→</span>
      </Link>
      <p className="text-[11px] text-fy-dim mb-6 px-1">
        Si tenés un viaje activo, el botón abre el seguimiento de ese envío.
      </p>

      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-display font-bold">Viajes de retorno</h3>
        <span className="text-brand-teal-light text-xs font-semibold">Activos</span>
      </div>
      <p className="text-fy-dim text-xs mb-3 leading-relaxed">
        Fletes donde el conductor aprovecha espacio en la vuelta u ofertas encadenadas: suele traducirse en menos costo para vos y más carga útil para el fletero.
      </p>

      {backhaulTrips.length ? (
        backhaulTrips.map((trip) => (
        <div key={trip.id} className="card mb-2 !p-3.5 opacity-90">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-semibold text-fy-text">{trip.from}</span>
                <span className="text-brand-teal-light">→</span>
                <span className="font-semibold text-fy-text">{trip.to}</span>
              </div>
              <span className="text-[10px] text-fy-dim uppercase tracking-wide">{trip.note}</span>
            </div>
            <span className="badge bg-brand-amber/15 text-brand-amber border border-brand-amber/25">
              ~{100 - parseInt(trip.space, 10)}% menos vs ida sola
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-fy-soft text-[11px]">
              🕐 {trip.time} · 📦 {trip.space}% capacidad libre
            </span>
            <span className="text-brand-amber font-bold font-display">${trip.price}</span>
          </div>
        </div>
        ))
      ) : (
        <p className="text-xs text-fy-dim rounded-xl border border-fy-border bg-brand-card/30 p-3">
          Cuando haya viajes de retorno compatibles con tus tramos, vas a verlos acá en tiempo real.
        </p>
      )}

      <Link
        href="/profile"
        className="mt-6 flex items-center gap-3 p-3 rounded-xl border border-fy-border bg-brand-surface/30 text-sm text-fy-soft hover:border-brand-teal/30 transition-colors"
      >
        <span className="text-lg">◉</span>
        <span>Perfil, documentación (fleteros) y datos de cuenta</span>
        <span className="ml-auto text-brand-teal-light">→</span>
      </Link>
    </div>
  );
}
