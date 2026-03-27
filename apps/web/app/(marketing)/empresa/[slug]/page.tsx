import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FOOTER_COMPANY_LINKS,
  INSTITUTIONAL_COMPANY_DOCS,
} from "@/lib/content/institutional-web";

type CompanyPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return FOOTER_COMPANY_LINKS.map((item) => ({
    slug: item.href.split("/").pop() ?? "",
  }));
}

export function generateMetadata({ params }: CompanyPageProps): Metadata {
  const content = INSTITUTIONAL_COMPANY_DOCS[params.slug];
  if (!content) {
    return {
      title: "Empresa | FleteYa",
      description: "Información institucional de FleteYa.",
    };
  }

  return {
    title: `${content.title} | Empresa | FleteYa`,
    description: content.body[0] ?? content.subtitle,
    alternates: {
      canonical: `/empresa/${params.slug}`,
    },
    openGraph: {
      title: `${content.title} | FleteYa`,
      description: content.body[0] ?? content.subtitle,
      url: `https://fletaya.com.ar/empresa/${params.slug}`,
      type: "article",
      locale: "es_AR",
    },
  };
}

export default function CompanyDocPage({ params }: CompanyPageProps) {
  const content = INSTITUTIONAL_COMPANY_DOCS[params.slug];
  if (!content) notFound();
  const related = FOOTER_COMPANY_LINKS.filter((item) => !item.href.endsWith(`/${params.slug}`)).slice(0, 3);

  return (
    <main className="min-h-[100dvh] bg-fy-bg-warm px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-3xl rounded-2xl border border-fy-border bg-white p-6 sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-teal-light">
          Empresa
        </p>
        <h1 className="mb-2 text-2xl font-display font-bold text-fy-text">{content.title}</h1>
        <p className="mb-6 text-sm text-fy-soft">{content.subtitle}</p>
        <div className="space-y-3 text-sm leading-relaxed text-fy-soft">
          {content.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-brand-teal/20 bg-brand-teal/5 p-4">
          <p className="text-sm font-semibold text-fy-text mb-2">¿Querés publicar un envío ahora?</p>
          <p className="text-xs text-fy-soft mb-3">
            Podés iniciar como cliente o como fletero y continuar el flujo completo desde la app.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login?role=client" className="btn-primary text-sm !px-4 !py-2">
              Publicar envío
            </Link>
            <Link href="/login?role=driver" className="btn-secondary text-sm !px-4 !py-2">
              Quiero ser fletero
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-heading font-bold text-fy-text mb-2">Más sobre FleteYa</h2>
          <div className="space-y-1.5">
            {related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm text-brand-teal-light hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/" className="font-semibold text-brand-teal-light hover:underline">
            Volver al inicio
          </Link>
          <Link href="/#precios" className="font-semibold text-brand-teal-light hover:underline">
            Ver precios
          </Link>
        </div>
      </section>
    </main>
  );
}
