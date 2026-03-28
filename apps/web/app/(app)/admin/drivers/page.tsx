"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-fetch";

type DriverRow = {
  id: string;
  user_id: string;
  verified: boolean;
  dni_verified: boolean;
  dni_front_url: string | null;
  dni_back_url: string | null;
  selfie_url: string | null;
  license_url: string | null;
  license_expiry: string | null;
  insurance_url: string | null;
  insurance_expiry: string | null;
  vtv_url: string | null;
  vtv_expiry: string | null;
  rating: number;
  total_trips: number;
  profiles: { name: string; email: string; phone: string | null; avatar_url: string | null };
};

const TABS = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendientes" },
  { id: "verified", label: "Verificados" },
  { id: "unverified", label: "Sin verificar" },
];

function isExpired(date: string | null): boolean {
  if (!date) return false;
  return date < new Date().toISOString().slice(0, 10);
}

export default function AdminDriversPage() {
  const [tab, setTab] = useState("pending");
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/drivers?status=${tab}&page=${page}&limit=20`);
    const data = await res.json();
    setDrivers(data.drivers ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [tab, page]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleVerify = async (driverId: string, action: "approve" | "reject") => {
    const reason =
      action === "reject"
        ? window.prompt("Motivo del rechazo (opcional):")
        : undefined;

    if (action === "reject" && reason === null) return; // cancelled

    const confirmed = window.confirm(
      action === "approve"
        ? "¿Confirmar verificación del fletero?"
        : "¿Confirmar rechazo? El fletero deberá re-subir sus documentos."
    );
    if (!confirmed) return;

    await apiFetch(`/api/admin/drivers/${driverId}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: reason || undefined }),
    });

    fetchDrivers();
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-display font-bold text-fy-text mb-4">Fleteros</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? "bg-brand-teal/20 text-brand-teal-light"
                : "bg-brand-card text-fy-soft hover:text-fy-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-fy-dim py-12 animate-pulse">Cargando...</div>
      ) : drivers.length === 0 ? (
        <div className="text-center text-fy-soft py-12">No hay fleteros en esta categoría.</div>
      ) : (
        <div className="space-y-4">
          {drivers.map((d) => (
            <div key={d.id} className="card !p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-heading font-bold text-fy-text">
                      {d.profiles.name || "Sin nombre"}
                    </span>
                    {d.verified && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                        Verificado
                      </span>
                    )}
                    {!d.verified && d.dni_verified && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-fy-soft">{d.profiles.email}</div>
                  {d.profiles.phone && (
                    <div className="text-sm text-fy-dim">{d.profiles.phone}</div>
                  )}
                  <div className="flex flex-wrap gap-3 mt-3 text-xs">
                    <span>⭐ {Number(d.rating).toFixed(1)}</span>
                    <span>🚛 {d.total_trips} viajes</span>
                    <span className={isExpired(d.license_expiry) ? "text-red-400" : "text-fy-dim"}>
                      Licencia: {d.license_expiry ?? "—"}
                    </span>
                    <span className={isExpired(d.insurance_expiry) ? "text-red-400" : "text-fy-dim"}>
                      Seguro: {d.insurance_expiry ?? "—"}
                    </span>
                    <span className={isExpired(d.vtv_expiry) ? "text-red-400" : "text-fy-dim"}>
                      VTV: {d.vtv_expiry ?? "—"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-fy-dim">
                    {d.dni_front_url && <span className="underline">DNI Frente ✓</span>}
                    {d.dni_back_url && <span className="underline">DNI Dorso ✓</span>}
                    {d.selfie_url && <span className="underline">Selfie ✓</span>}
                    {d.license_url && <span className="underline">Licencia ✓</span>}
                    {d.insurance_url && <span className="underline">Seguro ✓</span>}
                    {d.vtv_url && <span className="underline">VTV ✓</span>}
                  </div>
                </div>
                {!d.verified && d.dni_verified && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleVerify(d.id, "approve")}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleVerify(d.id, "reject")}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm bg-brand-card text-fy-soft rounded-lg disabled:opacity-30"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-fy-dim">
            Pág {page} de {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm bg-brand-card text-fy-soft rounded-lg disabled:opacity-30"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
