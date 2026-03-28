"use client";

import { useEffect, useState } from "react";
import type { PlatformStats } from "@shared/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-fy-dim animate-pulse">Cargando estadísticas...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center text-fy-soft">No se pudieron cargar las estadísticas.</div>
    );
  }

  const cards = [
    { label: "Usuarios totales", value: stats.total_users, icon: "👥", color: "text-brand-teal-light" },
    { label: "Fleteros verificados", value: stats.verified_drivers, icon: "✅", color: "text-green-400" },
    { label: "Pendientes de verificación", value: stats.pending_verification, icon: "⏳", color: "text-brand-amber" },
    { label: "Envíos activos", value: stats.active_shipments, icon: "🚛", color: "text-blue-400" },
    { label: "Envíos entregados", value: stats.delivered_shipments, icon: "📦", color: "text-green-400" },
    { label: "Envíos cancelados", value: stats.cancelled_shipments, icon: "✕", color: "text-red-400" },
    { label: "Disputas abiertas", value: stats.open_disputes, icon: "⚖️", color: stats.open_disputes > 0 ? "text-red-400" : "text-green-400" },
    { label: "GMV total", value: `$${Number(stats.total_gmv).toLocaleString("es-AR")}`, icon: "💰", color: "text-brand-amber" },
    { label: "Revenue (comisiones)", value: `$${Number(stats.total_revenue).toLocaleString("es-AR")}`, icon: "📈", color: "text-brand-teal-light" },
    { label: "Referidos totales", value: stats.total_referrals, icon: "🤝", color: "text-purple-400" },
    { label: "Códigos activos", value: stats.active_referral_codes, icon: "🎟️", color: "text-brand-coral" },
    { label: "Fleteros totales", value: stats.total_drivers, icon: "🚐", color: "text-fy-soft" },
  ];

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-display font-bold text-fy-text mb-6">
        Dashboard
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => (
          <div key={card.label} className="card !p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{card.icon}</span>
              <span className={`text-xl sm:text-2xl font-display font-bold ${card.color}`}>
                {card.value}
              </span>
            </div>
            <div className="text-xs text-fy-soft">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
