import Link from "next/link";

// TODO: Fetch real data from Supabase
// TODO: Get user session and show personalized content

export default function DashboardPage() {
  return (
    <div className="p-5">
      <div className="mb-6">
        <h2 className="text-xl font-display font-bold mb-1">Hola 👋</h2>
        <p className="text-fy-soft text-sm">¿Qué necesitás mover hoy?</p>
      </div>

      {/* New shipment CTA */}
      <Link
        href="/(app)/shipment"
        className="block w-full p-5 rounded-2xl bg-gradient-to-r from-brand-teal to-brand-teal-light mb-4 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="text-xs font-semibold text-brand-ink/60 tracking-wider uppercase mb-1">
            Nuevo envío
          </div>
          <div className="text-lg font-display font-bold text-brand-ink">
            Cotizá y reservá tu flete
          </div>
          <div className="text-xs text-brand-ink/55 mt-1">
            Mudanzas · Mercadería · Materiales
          </div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl opacity-20">
          📦
        </div>
      </Link>

      {/* Active trip */}
      <Link
        href="/(app)/tracking"
        className="flex items-center gap-3 p-4 rounded-xl bg-brand-card border border-brand-teal/25 mb-6"
      >
        <div className="w-10 h-10 rounded-xl bg-brand-teal/15 flex items-center justify-center text-xl">
          📍
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Viaje activo</div>
          <div className="text-xs text-fy-dim mt-0.5">
            Palermo → Avellaneda · Ver tracking en vivo
          </div>
        </div>
        <span className="text-brand-teal-light">→</span>
      </Link>

      {/* Backhaul section */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-display font-bold">
          🔄 Viajes de retorno
        </h3>
        <span className="text-brand text-xs font-semibold">Ver todos →</span>
      </div>
      <p className="text-fy-dim text-xs mb-3">
        Fleteros volviendo con espacio. Hasta 40% menos.
      </p>

      {/* TODO: Fetch from Supabase */}
      {[
        { from: "Palermo", to: "Avellaneda", price: "8.500", time: "Hoy 16:00", space: "70%" },
        { from: "Belgrano", to: "Quilmes", price: "15.200", time: "Hoy 18:30", space: "45%" },
      ].map((trip, i) => (
        <div key={i} className="card mb-2 !p-3.5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-semibold">{trip.from}</span>
                <span className="text-brand">→</span>
                <span className="font-semibold">{trip.to}</span>
              </div>
            </div>
            <span className="badge bg-brand/10 text-brand border border-brand/20">
              -{100 - parseInt(trip.space)}% dto
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-fy-soft text-[11px]">
              🕐 {trip.time} · 📦 {trip.space} libre
            </span>
            <span className="text-brand font-bold font-display">
              ${trip.price}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
