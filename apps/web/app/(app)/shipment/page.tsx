import Link from "next/link";

export default function ShipmentPage() {
  const steps = [
    {
      n: 1,
      title: "Ruta",
      body: "Origen y destino con Google Places, mapa y hasta cinco tramos. Cada tramo extra puede activar descuentos encadenados en la cotización.",
    },
    {
      n: 2,
      title: "Carga",
      body: "Tipo de envío, peso aproximado, vehículo requerido, ayudantes y datos extra (por ejemplo acarreo o residuos normativos).",
    },
    {
      n: 3,
      title: "Asignación",
      body: "No elegís nombre de fletero: se abre la postulación, ves “esperando asignación” y la plataforma asigna por cercanía + valoración cuando corresponde.",
    },
    {
      n: 4,
      title: "Pago y confirmación",
      body: "Precio cerrado, MercadoPago, y después el viaje pasa a seguimiento cuando el estado lo permita.",
    },
  ];

  return (
    <div className="px-4 sm:px-5 py-5 pb-10 max-w-lg mx-auto min-w-0">
      <div className="mb-6 text-center">
        <div className="text-4xl mb-3">📦</div>
        <h2 className="text-lg font-display font-bold mb-2">Nuevo envío</h2>
        <p className="text-fy-dim text-sm leading-relaxed">
          El wizard completo (mapa, validaciones y API) está en desarrollo. Abajo está el flujo de producto que vamos a implementar tal cual.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-teal/25 bg-brand-teal/5 p-4 mb-6">
        <h3 className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wide mb-2">
          Modelo de asignación
        </h3>
        <p className="text-sm text-fy-soft leading-relaxed">
          Los conductores <strong className="text-fy-text">postulan</strong> con su ubicación. Si ya vienen de otro viaje, el sistema usa el{" "}
          <strong className="text-fy-text">fin del viaje actual</strong> para calcular cercanía con tu retiro: así se favorece encadenar varios servicios en el día y reducir costo para el cliente.
        </p>
      </div>

      <ul className="space-y-4">
        {steps.map((s) => (
          <li
            key={s.n}
            className="flex gap-4 p-4 rounded-xl border border-fy-border bg-brand-card/40"
          >
            <div className="shrink-0 w-9 h-9 rounded-xl bg-brand-amber/15 text-brand-amber font-display font-bold flex items-center justify-center text-sm">
              {s.n}
            </div>
            <div className="text-left">
              <div className="font-heading font-semibold text-fy-text text-sm mb-1">{s.title}</div>
              <p className="text-fy-soft text-xs leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-xl border border-dashed border-fy-border p-4 text-center">
        <p className="text-fy-dim text-xs mb-3">
          ¿Primera vez? Revisá el paso a paso en el inicio o volvé al dashboard.
        </p>
        <Link href="/dashboard" className="text-sm font-semibold text-brand-teal-light hover:underline">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
