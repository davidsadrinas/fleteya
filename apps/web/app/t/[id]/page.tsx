"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { STATUS_META } from "@shared/types";

type TrackingData = {
  status: string;
  originAddress: string | null;
  destAddress: string | null;
  driverName: string | null;
};

const STATUSES = Object.entries(STATUS_META).map(([key, value]) => ({
  key,
  label: value.label,
}));

export default function PublicTrackingPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = useMemo(() => createClient(), []);
  const shipmentId = params.id;
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: shipment } = await supabase
        .from("shipments")
        .select("status,driver_id")
        .eq("id", shipmentId)
        .maybeSingle();

      if (!shipment) {
        setLoading(false);
        return;
      }

      const { data: legs } = await supabase
        .from("shipment_legs")
        .select("origin_address,dest_address")
        .eq("shipment_id", shipmentId)
        .order("leg_order", { ascending: true });

      let driverName: string | null = null;
      const driverId = (shipment as { driver_id?: string | null })?.driver_id;
      if (driverId) {
        const { data: driver } = await supabase
          .from("drivers")
          .select("user_id")
          .eq("id", driverId)
          .maybeSingle();
        const userId = (driver as { user_id?: string | null })?.user_id;
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", userId)
            .maybeSingle();
          driverName = (profile as { name?: string | null })?.name ?? null;
        }
      }

      const firstLeg = legs?.[0] as { origin_address?: string; dest_address?: string } | undefined;
      const lastLeg = legs?.[legs.length - 1] as { dest_address?: string } | undefined;

      setData({
        status: (shipment as { status: string }).status,
        originAddress: firstLeg?.origin_address ?? null,
        destAddress: lastLeg?.dest_address ?? null,
        driverName,
      });
      setLoading(false);
    };

    void load();

    const channel = supabase
      .channel(`public-tracking-${shipmentId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shipments", filter: `id=eq.${shipmentId}` },
        (payload) => {
          const newStatus = (payload.new as { status?: string })?.status;
          if (newStatus) {
            setData((prev) => (prev ? { ...prev, status: newStatus } : prev));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [shipmentId, supabase]);

  const currentIdx = data ? STATUSES.findIndex((s) => s.key === data.status) : -1;
  const progressPct = data
    ? Math.min(100, Math.max(10, ((currentIdx + 1) / STATUSES.length) * 100))
    : 0;

  return (
    <main className="min-h-screen bg-fy-bg text-fy-text">
      <header className="px-4 py-4 border-b border-fy-border">
        <Link href="/" className="text-lg font-display font-extrabold">
          <span className="text-fy-text">flete</span>
          <span className="text-brand-amber">&nbsp;ya</span>
        </Link>
      </header>

      <div className="px-4 sm:px-5 py-6 pb-10 max-w-lg mx-auto">
        {loading ? (
          <p className="text-fy-soft text-center py-10">Cargando seguimiento...</p>
        ) : !data ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-4">📦</div>
            <h1 className="text-lg font-display font-bold mb-2">Envio no encontrado</h1>
            <p className="text-fy-dim text-sm">
              El enlace de seguimiento no es valido o el envio fue eliminado.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📍</div>
              <h1 className="text-lg font-display font-bold mb-1">Seguimiento de envio</h1>
              <p className="text-xs text-fy-dim font-mono">#{shipmentId.slice(0, 8)}</p>
            </div>

            <section className="rounded-2xl border border-brand-teal/30 bg-brand-teal/5 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">
                  {STATUSES[currentIdx]?.label ?? data.status}
                </p>
                <span className="text-xs text-brand-teal-light">
                  {data.status === "delivered" ? "Completado" : "En curso"}
                </span>
              </div>
              <div className="h-2 bg-brand-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-teal-light transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </section>

            <section className="rounded-xl border border-fy-border bg-brand-card/30 p-4 mb-4">
              <ul className="text-sm text-fy-soft space-y-2">
                <li>
                  Retiro: <span className="text-fy-text">{data.originAddress ?? "En confirmacion"}</span>
                </li>
                <li>
                  Entrega: <span className="text-fy-text">{data.destAddress ?? "En confirmacion"}</span>
                </li>
                <li>
                  Fletero: <span className="text-fy-text">{data.driverName ?? "Asignacion en curso"}</span>
                </li>
              </ul>
            </section>

            <section className="rounded-xl border border-fy-border bg-brand-card/30 p-4 mb-6">
              <h2 className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wide mb-3">
                Progreso
              </h2>
              <ul className="space-y-2">
                {STATUSES.map((s, i) => (
                  <li key={s.key} className="flex items-center gap-3 text-xs">
                    <span
                      className={`shrink-0 w-2.5 h-2.5 rounded-full ${
                        i < currentIdx
                          ? "bg-brand-teal-light"
                          : i === currentIdx
                          ? "bg-brand-teal-light animate-pulse-slow"
                          : "bg-fy-border"
                      }`}
                    />
                    <span className={i <= currentIdx ? "text-fy-text font-semibold" : "text-fy-dim"}>
                      {s.label}
                    </span>
                    {i < currentIdx && <span className="text-brand-teal-light ml-auto">✓</span>}
                  </li>
                ))}
              </ul>
            </section>

            <div className="text-center">
              <Link href="/login" className="btn-primary inline-block px-8">
                Necesitas un flete? Registrate
              </Link>
              <p className="text-[11px] text-fy-dim mt-3">
                Powered by FleteYa — Marketplace de fletes en AMBA
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
