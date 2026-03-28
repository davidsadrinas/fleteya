import type { Metadata } from "next";
import Link from "next/link";
import { MARKETING_FOR_DRIVERS } from "@/lib/content/institutional-web";

export const metadata: Metadata = {
  title: "Para fleteros | FleteYa",
  description:
    "Postulá a cargas abiertas, encadená viajes y mejorá tus ingresos con asignación por cercanía y reputación.",
  alternates: {
    canonical: "/fleteros",
  },
};

export default function FleterosPage() {
  return (
    <main className="min-h-[100dvh] bg-brand-navy px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-4xl">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-brand-teal-light text-xs font-bold font-heading tracking-wide mb-4">
          {MARKETING_FOR_DRIVERS.tag}
        </span>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
          {MARKETING_FOR_DRIVERS.titleLine1}
          <br />
          <span className="text-brand-amber">{MARKETING_FOR_DRIVERS.titleLine2}</span>
        </h1>
        <p className="text-brand-teal-light/90 mt-4 mb-8 max-w-3xl leading-relaxed">
          {MARKETING_FOR_DRIVERS.intro}
        </p>

        <div className="grid md:grid-cols-2 gap-5">
          {MARKETING_FOR_DRIVERS.features.map((item) => (
            <article key={item.title} className="bg-white/10 border border-white/10 rounded-2xl p-5 flex gap-3">
              <div className="text-2xl">{item.icon}</div>
              <div>
                <h2 className="font-heading font-bold text-white mb-1">{item.title}</h2>
                <p className="text-brand-teal-light/80 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <Link href={MARKETING_FOR_DRIVERS.cta.href} className="btn-primary text-sm !px-5 !py-3">
            {MARKETING_FOR_DRIVERS.cta.label}
          </Link>
        </div>
      </section>
    </main>
  );
}
