const SECTIONS = [
  {
    title: "Cuenta",
    items: [
      {
        label: "Datos personales",
        desc: "Nombre, teléfono, avatar. Algunos campos vienen del login social o del onboarding.",
      },
      {
        label: "Cerrar sesión",
        desc: "Desconectar este dispositivo; la próxima vez tendrás que ingresar de nuevo.",
      },
    ],
  },
  {
    title: "Notificaciones",
    items: [
      {
        label: "Push y correo",
        desc: "Avisos de asignación, cambios de estado del viaje y mensajes (configuración detallada próximamente).",
      },
    ],
  },
  {
    title: "Pagos",
    items: [
      {
        label: "MercadoPago",
        desc: "Checkout y split de comisión (22%) según se implemente el flujo de pago en el wizard.",
      },
      {
        label: "Historial de cobros",
        desc: "Facturación y liquidaciones para fleteros (dashboard financiero en roadmap).",
      },
    ],
  },
  {
    title: "Preferencias",
    items: [
      {
        label: "Rol en la app",
        desc: "Cliente o fletero se define en el onboarding; cambios de rol pueden requerir soporte hasta que exista el flujo en UI.",
      },
      {
        label: "Eliminar cuenta",
        desc: "Proceso bajo política de datos; link a términos y privacidad desde la web pública cuando estén publicados.",
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="px-4 sm:px-5 py-5 pb-10 max-w-lg mx-auto min-w-0 text-left">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">⚙️</div>
        <h2 className="text-lg font-display font-bold mb-2">Configuración</h2>
        <p className="text-fy-dim text-sm leading-relaxed">
          Centro único para cuenta, avisos y pagos. Los toggles y formularios se van activando según avance el producto.
        </p>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((sec) => (
          <section key={sec.title}>
            <h3 className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wide mb-3">
              {sec.title}
            </h3>
            <ul className="space-y-3">
              {sec.items.map((item) => (
                <li
                  key={item.label}
                  className="rounded-xl border border-fy-border bg-brand-card/30 p-4"
                >
                  <div className="font-heading font-semibold text-fy-text text-sm mb-1">{item.label}</div>
                  <p className="text-fy-dim text-xs leading-relaxed">{item.desc}</p>
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-wide text-fy-dim">
                    Próximo: UI editable
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-8 text-center text-[11px] text-fy-dim leading-relaxed">
        ¿Dudas sobre asignación o postulaciones? Revisá el inicio del dashboard o la landing en{" "}
        <a href="/#como-funciona" className="text-brand-teal-light hover:underline">
          cómo funciona
        </a>
        .
      </p>
    </div>
  );
}
