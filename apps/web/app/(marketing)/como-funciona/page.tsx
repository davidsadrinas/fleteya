import type { Metadata } from "next";
import Link from "next/link";
import { MARKETING_HOW_IT_WORKS } from "@/lib/content/institutional-web";

export const metadata: Metadata = {
  title: "Cómo funciona | FleteYa",
  description:
    "Publicás el envío, los fleteros se postulan y FleteYa asigna por cercanía y reputación.",
  alternates: {
    canonical: "/como-funciona",
  },
};

export default function ComoFuncionaPage() {
  return (
    <main className="min-h-[100dvh] bg-fy-bg px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-4xl">
        <p className="section-tag mb-4 inline-block">{MARKETING_HOW_IT_WORKS.sectionTag}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-fy-text">
          {MARKETING_HOW_IT_WORKS.title}
        </h1>
        <p className="text-fy-soft mt-3 mb-8 max-w-2xl">{MARKETING_HOW_IT_WORKS.intro}</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {MARKETING_HOW_IT_WORKS.steps.map((item) => (
            <article key={item.step} className="card !border-transparent">
              <div className={`w-14 h-14 ${item.bgClass} rounded-xl flex items-center justify-center text-2xl mb-3`}>
                {item.icon}
              </div>
              <p className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${item.accentClass} text-white text-[10px] font-bold mb-2`}>
                {item.step}
              </p>
              <h2 className="text-base font-display font-bold text-fy-text mb-2">{item.title}</h2>
              <p className="text-sm text-fy-soft leading-relaxed">{item.desc}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login?role=client" className="btn-primary text-sm !px-4 !py-2">
            Publicar envío
          </Link>
          <Link href="/login?role=driver" className="btn-secondary text-sm !px-4 !py-2">
            Soy fletero
          </Link>
        </div>
      </section>
    </main>
  );
}
