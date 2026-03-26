import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="px-4 sm:px-5 py-5 pb-10 max-w-lg mx-auto min-w-0">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">◉</div>
        <h2 className="text-lg font-display font-bold mb-2">Mi perfil</h2>
        <p className="text-fy-dim text-sm leading-relaxed">
          Un solo lugar para tus datos personales, historial y —si sos fletero— documentación y flota.
        </p>
      </div>

      <section className="mb-5 rounded-2xl border border-fy-border bg-brand-card/40 p-4">
        <h3 className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wide mb-3">
          Cliente
        </h3>
        <ul className="text-sm text-fy-soft space-y-2">
          <li>• Nombre, teléfono, foto (sincronizado con Supabase Auth y <code className="text-[11px] text-fy-dim">profiles</code>).</li>
          <li>• Historial de envíos, reseñas hechas y upcoming “esperando asignación”.</li>
          <li>• Preferencias de notificación (cuando activemos la capa completa).</li>
        </ul>
      </section>

      <section className="mb-6 rounded-2xl border border-fy-border bg-brand-card/40 p-4">
        <h3 className="text-xs font-heading font-bold text-brand-amber uppercase tracking-wide mb-3">
          Fletero
        </h3>
        <ul className="text-sm text-fy-soft space-y-2">
          <li>
            • <strong className="text-fy-text">Verificación:</strong> DNI, licencia, seguro, VTV y certificados para grúa o atmosférico según reglas del marketplace.
          </li>
          <li>
            • <strong className="text-fy-text">Vehículos:</strong> uno o más; el activo se usa al asignar un envío.
          </li>
          <li>
            • <strong className="text-fy-text">Reputación:</strong> rating y cantidad de viajes alimentan la asignación por cercanía + valoración.
          </li>
          <li>• Ingresos y estadísticas (en desarrollo).</li>
        </ul>
      </section>

      <Link
        href="/settings"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-fy-border text-sm font-semibold text-fy-text hover:bg-brand-surface/50 transition-colors"
      >
        ⚙️ Configuración de cuenta
      </Link>
    </div>
  );
}
