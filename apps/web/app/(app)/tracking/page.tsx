const STATUSES = [
  { key: "pending", label: "Pendiente", hint: "Publicado o esperando asignación." },
  { key: "accepted", label: "Asignado", hint: "Ya hay fletero y vehículo confirmados." },
  { key: "heading_to_origin", label: "En camino al origen", hint: "Se acerca al punto de carga." },
  { key: "at_origin", label: "En el origen", hint: "Listo para cargar." },
  { key: "loading", label: "Cargando", hint: "Mercadería o muebles a bordo." },
  { key: "in_transit", label: "En tránsito", hint: "Rumbo al destino; GPS en vivo." },
  { key: "arriving", label: "Llegando", hint: "Cerca del destino final." },
  { key: "delivered", label: "Entregado", hint: "Cierra con reseña opcional." },
];

export default function TrackingPage() {
  return (
    <div className="px-4 sm:px-5 py-5 pb-10 max-w-lg mx-auto min-w-0">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">📍</div>
        <h2 className="text-lg font-display font-bold mb-2">Tracking en vivo</h2>
        <p className="text-fy-dim text-sm leading-relaxed">
          Acá verás el mapa con la posición del fletero (Supabase Realtime + Google Maps), la línea de recorrido y acciones de contacto cuando el envío esté activo.
        </p>
      </div>

      <section className="rounded-2xl border border-fy-border bg-brand-card/40 p-4 mb-6">
        <h3 className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wide mb-3">
          Estados del viaje
        </h3>
        <p className="text-xs text-fy-soft mb-4 leading-relaxed">
          Cada cambio de estado se refleja en la app del cliente y ayuda al fletero a encadenar el siguiente viaje con datos claros.
        </p>
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {STATUSES.map((s) => (
            <li
              key={s.key}
              className="flex gap-3 text-left text-xs border-b border-fy-border/60 pb-2 last:border-0 last:pb-0"
            >
              <span className="shrink-0 w-2 h-2 mt-1 rounded-full bg-brand-teal-light/80" />
              <div>
                <div className="font-semibold text-fy-text">{s.label}</div>
                <div className="text-fy-dim">{s.hint}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-xl border border-dashed border-fy-border p-4 text-center text-fy-dim text-xs leading-relaxed">
        La vista de mapa animado y la suscripción en tiempo real a <code className="text-fy-soft">tracking_points</code> se integran en el PASO de tracking de la guía de desarrollo.
      </div>
    </div>
  );
}
