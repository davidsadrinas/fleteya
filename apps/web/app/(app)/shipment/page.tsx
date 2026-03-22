// TODO: Implement full shipment wizard
// Step 1: Route (Google Places autocomplete + map + multi-leg)
// Step 2: Cargo (type, weight, vehicle, helpers)
// Step 3: Select driver (matching engine results)
// Step 4: Confirm and pay (MercadoPago checkout)

export default function ShipmentPage() {
  return (
    <div className="p-5 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-4xl mb-4">📦</div>
      <h2 className="text-lg font-display font-bold mb-2">Nuevo envío</h2>
      <p className="text-fy-dim text-sm max-w-xs">
        Wizard de 4 pasos: Ruta → Carga → Fletero → Confirmación.
        Incluye autocomplete Google Places, mapa interactivo, y descuentos por multi-tramo.
      </p>
    </div>
  );
}
