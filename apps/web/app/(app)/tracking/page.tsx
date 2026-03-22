// TODO: Implement live GPS tracking
// - Supabase Realtime subscription to tracking_points table
// - Google Maps with animated driver marker
// - Status timeline (7 states)
// - Driver card with chat/call
// - ETA calculation

export default function TrackingPage() {
  return (
    <div className="p-5 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-4xl mb-4">📍</div>
      <h2 className="text-lg font-display font-bold mb-2">Tracking en vivo</h2>
      <p className="text-fy-dim text-sm max-w-xs">
        Mapa GPS en tiempo real con la posición del fletero, timeline de estados, ETA, y acciones de contacto.
      </p>
    </div>
  );
}
