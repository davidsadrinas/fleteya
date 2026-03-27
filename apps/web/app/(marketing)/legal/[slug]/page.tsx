import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FOOTER_LEGAL_LINKS,
  INSTITUTIONAL_LEGAL_DOCS,
} from "@/lib/content/institutional-web";

type LegalPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return FOOTER_LEGAL_LINKS.map((item) => ({
    slug: item.href.split("/").pop() ?? "",
  }));
}

export function generateMetadata({ params }: LegalPageProps): Metadata {
  const content = INSTITUTIONAL_LEGAL_DOCS[params.slug];
  if (!content) {
    return {
      title: "Legal | FleteYa",
      description: "Documentación legal de FleteYa.",
    };
  }

  return {
    title: `${content.title} | Legal | FleteYa`,
    description: content.body[0] ?? content.subtitle,
    alternates: {
      canonical: `/legal/${params.slug}`,
    },
    openGraph: {
      title: `${content.title} | FleteYa`,
      description: content.body[0] ?? content.subtitle,
      url: `https://fletaya.com.ar/legal/${params.slug}`,
      type: "article",
      locale: "es_AR",
    },
  };
}

export default function LegalDocPage({ params }: LegalPageProps) {
  const content = INSTITUTIONAL_LEGAL_DOCS[params.slug];
  if (!content) notFound();
  const related = FOOTER_LEGAL_LINKS.filter((item) => !item.href.endsWith(`/${params.slug}`)).slice(0, 3);

  return (
    <main className="min-h-[100dvh] bg-fy-bg-warm px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-3xl rounded-2xl border border-fy-border bg-white p-6 sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-teal-light">
          Legal
        </p>
        <h1 className="mb-2 text-2xl font-display font-bold text-fy-text">{content.title}</h1>
        <p className="mb-6 text-sm text-fy-soft">{content.subtitle}</p>
        <div className="space-y-3 text-sm leading-relaxed text-fy-soft">
          {content.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-brand-teal/20 bg-brand-teal/5 p-4">
          <p className="text-sm font-semibold text-fy-text mb-2">¿Querés avanzar con un envío?</p>
          <p className="text-xs text-fy-soft mb-3">
            Conocé condiciones, publicá tu viaje y seguí todo el proceso desde una sola plataforma.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login?role=client" className="btn-primary text-sm !px-4 !py-2">
              Ingresar como cliente
            </Link>
            <Link href="/#como-funciona" className="btn-secondary text-sm !px-4 !py-2">
              Cómo funciona
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-heading font-bold text-fy-text mb-2">Documentos relacionados</h2>
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
