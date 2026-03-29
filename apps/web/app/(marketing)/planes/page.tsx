"use client";

import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing-navbar";

const PLANS = [
  {
    name: "Particular",
    price: "Gratis",
    priceNote: "Pagas por envio",
    description: "Para personas que necesitan un flete puntual.",
    features: [
      "Cotizacion instantanea",
      "Hasta 5 tramos por envio",
      "Tracking en tiempo real",
      "Chat con el fletero",
      "Seguro de responsabilidad civil",
      "Pago con MercadoPago",
    ],
    cta: "Empezar gratis",
    href: "/login",
    highlighted: false,
    commission: "22%",
  },
  {
    name: "Comercio",
    price: "$14.900",
    priceNote: "/mes + IVA",
    description: "Para PyMEs y comercios con envios recurrentes.",
    features: [
      "Todo lo de Particular",
      "10 envios incluidos/mes",
      "Comision reducida: 18%",
      "Fletero favorito con prioridad",
      "Soporte prioritario por WhatsApp",
      "Dashboard de gastos mensuales",
      "Facturacion automatica",
    ],
    cta: "Probar 14 dias gratis",
    href: "/login",
    highlighted: true,
    commission: "18%",
    badge: "Popular",
  },
  {
    name: "Empresa",
    price: "$39.900",
    priceNote: "/mes + IVA",
    description: "Para operaciones logisticas con volumen.",
    features: [
      "Todo lo de Comercio",
      "30 envios incluidos/mes",
      "Comision reducida: 15%",
      "Multiples usuarios/operadores",
      "API de integracion",
      "Reportes avanzados y exportacion",
      "Account manager dedicado",
      "SLA de asignacion: 30 min",
    ],
    cta: "Contactar ventas",
    href: "/login",
    highlighted: false,
    commission: "15%",
  },
];

const FAQ = [
  {
    q: "Puedo cambiar de plan en cualquier momento?",
    a: "Si, podes subir o bajar de plan cuando quieras. Los envios incluidos se prorrratean.",
  },
  {
    q: "Que pasa si uso mas envios que los incluidos?",
    a: "Los envios adicionales se cobran con la comision de tu plan. Sin recargos sorpresa.",
  },
  {
    q: "Hay permanencia minima?",
    a: "No. Podes cancelar en cualquier momento. Sin letra chica.",
  },
  {
    q: "Que medios de pago aceptan?",
    a: "MercadoPago, tarjeta de credito/debito, y transferencia bancaria para planes Empresa.",
  },
];

export default function PlanesPage() {
  return (
    <main className="min-w-0 overflow-x-hidden">
      <MarketingNavbar />

      <section className="pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-brand-teal/10 border border-brand-teal/25 text-brand-teal-light text-xs font-semibold px-4 py-1.5 mb-4">
              Planes para cada necesidad
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-fy-text mb-3">
              Precio justo, <span className="text-brand-amber">sin sorpresas</span>
            </h1>
            <p className="text-fy-soft max-w-xl mx-auto">
              Desde un flete puntual hasta operaciones logisticas diarias. Elegi el plan que se ajuste a tu volumen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-16">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  plan.highlighted
                    ? "border-brand-teal bg-brand-teal/5 shadow-lg shadow-brand-teal/10"
                    : "border-fy-border bg-brand-card/30"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-amber text-brand-ink text-xs font-bold px-4 py-1">
                    {plan.badge}
                  </span>
                )}
                <h2 className="text-lg font-display font-bold mb-1">{plan.name}</h2>
                <p className="text-xs text-fy-dim mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-display font-extrabold text-brand-amber">
                    {plan.price}
                  </span>
                  <span className="text-sm text-fy-dim ml-1">{plan.priceNote}</span>
                </div>
                <div className="mb-2 text-xs text-fy-soft">
                  Comision por envio: <span className="text-brand-teal-light font-bold">{plan.commission}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-fy-soft">
                      <span className="text-brand-teal-light mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center rounded-xl py-3 text-sm font-bold transition-colors ${
                    plan.highlighted
                      ? "bg-brand-teal text-brand-ink hover:bg-brand-teal-dark"
                      : "border border-fy-border text-fy-text hover:border-brand-teal/40"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-display font-bold text-center mb-8">
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {FAQ.map((item) => (
                <div key={item.q} className="rounded-xl border border-fy-border bg-brand-card/30 p-4">
                  <p className="text-sm font-semibold text-fy-text mb-1">{item.q}</p>
                  <p className="text-sm text-fy-soft">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-fy-dim text-sm mb-4">
              Necesitas algo a medida? Hablemos.
            </p>
            <Link
              href="/login"
              className="btn-primary inline-block px-8"
            >
              Contactar al equipo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
