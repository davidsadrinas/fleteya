"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing-navbar";
import { apiFetch } from "@/lib/api-fetch";
import { SHIPMENT_TYPES } from "@shared/constants";

type QuoteLeg = {
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
};

type QuoteResult = {
  legs: Array<{ originAddress: string; destAddress: string; distanceKm: number; price: number; discount: number }>;
  basePrice: number;
  finalPrice: number;
  commission: number;
  savings: number;
};

const AMBA = { lat: -34.6037, lng: -58.3816 };

export default function CotizarPage() {
  const [legs, setLegs] = useState<QuoteLeg[]>([
    { originAddress: "", originLat: AMBA.lat - 0.02, originLng: AMBA.lng - 0.01, destAddress: "", destLat: AMBA.lat + 0.03, destLng: AMBA.lng + 0.02 },
  ]);
  const [shipmentType, setShipmentType] = useState("");
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateLeg = (i: number, field: keyof QuoteLeg, value: string) => {
    const updated = [...legs];
    updated[i] = { ...updated[i], [field]: value };
    setLegs(updated);
  };

  const addLeg = () => {
    if (legs.length >= 5) return;
    const last = legs[legs.length - 1];
    setLegs([
      ...legs,
      {
        originAddress: last.destAddress,
        originLat: last.destLat + 0.01,
        originLng: last.destLng + 0.005,
        destAddress: "",
        destLat: last.destLat + 0.04,
        destLng: last.destLng + 0.02,
      },
    ]);
  };

  const removeLeg = (i: number) => {
    if (legs.length <= 1) return;
    setLegs(legs.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (legs.some((l) => !l.originAddress || !l.destAddress)) {
      setError("Completá todas las direcciones");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await apiFetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legs, shipmentType: shipmentType || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al cotizar");
      } else {
        setResult(data);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-w-0 overflow-x-hidden">
      <MarketingNavbar />
      <section className="pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-fy-text mb-3">
              Cotizá tu flete <span className="text-brand-amber">al instante</span>
            </h1>
            <p className="text-fy-soft">Sin registro. Precio estimado en segundos.</p>
          </div>

          <div className="card !p-5 sm:!p-6 mb-6">
            <h2 className="font-heading font-bold text-fy-text mb-4">Recorrido</h2>
            {legs.map((leg, i) => (
              <div key={i} className="mb-4 pb-4 border-b border-fy-border last:border-0 last:pb-0 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-heading font-bold text-brand-teal-light">
                    Tramo {i + 1}
                  </span>
                  {legs.length > 1 && (
                    <button onClick={() => removeLeg(i)} className="text-xs text-red-400 hover:text-red-300">
                      Eliminar
                    </button>
                  )}
                </div>
                <div className="grid gap-3">
                  <input
                    type="text"
                    placeholder="Origen — Ej: Av. Corrientes 1234, CABA"
                    value={leg.originAddress}
                    onChange={(e) => updateLeg(i, "originAddress", e.target.value)}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="Destino — Ej: Av. Rivadavia 5678, CABA"
                    value={leg.destAddress}
                    onChange={(e) => updateLeg(i, "destAddress", e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            ))}
            {legs.length < 5 && (
              <button onClick={addLeg} className="text-sm text-brand-teal-light hover:underline mt-2">
                + Agregar parada
              </button>
            )}
          </div>

          <div className="card !p-5 sm:!p-6 mb-6">
            <h2 className="font-heading font-bold text-fy-text mb-3">Tipo de envío</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SHIPMENT_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setShipmentType(t.id)}
                  className={`p-3 rounded-xl border text-center text-sm transition-colors ${
                    shipmentType === t.id
                      ? "border-brand-teal-light bg-brand-teal/10 text-brand-teal-light"
                      : "border-fy-border bg-brand-card text-fy-soft hover:text-fy-text"
                  }`}
                >
                  <div className="text-xl mb-1">{t.icon}</div>
                  <div className="text-xs font-medium">{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center mb-4">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full text-lg !py-4 disabled:opacity-50"
          >
            {loading ? "Calculando..." : "Cotizar ahora"}
          </button>

          {result && (
            <div className="card !p-5 sm:!p-6 mt-6">
              <div className="text-center mb-6">
                <div className="text-sm text-fy-soft mb-1">Precio estimado</div>
                <div className="text-4xl font-display font-extrabold text-brand-amber">
                  ${result.finalPrice.toLocaleString("es-AR")}
                </div>
                {result.savings > 0 && (
                  <div className="text-sm text-green-400 mt-1">
                    Ahorrás ${result.savings.toLocaleString("es-AR")} con tramos encadenados
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-6">
                {result.legs.map((leg, i) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b border-fy-border last:border-0">
                    <div className="text-fy-soft min-w-0 flex-1">
                      <span className="text-xs text-brand-teal-light font-bold mr-2">Tramo {i + 1}</span>
                      {leg.distanceKm.toFixed(1)} km
                      {leg.discount > 0 && (
                        <span className="text-green-400 ml-1">(-{leg.discount}%)</span>
                      )}
                    </div>
                    <div className="text-fy-text font-medium">
                      ${leg.price.toLocaleString("es-AR")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login" className="btn-primary flex-1 text-center">
                  Registrate para reservar
                </Link>
                <Link href="/login" className="btn-secondary flex-1 text-center">
                  Ya tenés cuenta? Iniciá sesión
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
