import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing-navbar";
import {
  FOOTER_PRODUCT_LINKS,
  FOOTER_COMPANY_LINKS,
  FOOTER_LEGAL_LINKS,
  FOOTER_SECTIONS,
  FOOTER_SOCIAL_LINKS,
  INSTITUTIONAL_WEB_RESUME,
  MARKETING_FAQ,
  MARKETING_FOR_DRIVERS,
  MARKETING_HERO,
  MARKETING_HOW_IT_WORKS,
  MARKETING_PRICING,
  MARKETING_REVIEWS,
  MARKETING_STATS,
} from "@/lib/content/institutional-web";

function Hero() {
  return (
    <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Soft organic background shapes */}
      <div className="absolute top-20 right-0 w-72 h-72 bg-brand-mint-pale rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-0 left-10 w-56 h-56 bg-brand-sunshine-light rounded-full blur-3xl opacity-30" />
      <div className="absolute top-40 left-1/3 w-40 h-40 bg-brand-coral-light/20 rounded-full blur-2xl" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-teal-pale border border-brand-teal-light/30 text-brand-teal-light text-sm font-semibold font-heading mb-8">
          <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
          {MARKETING_HERO.badge}
        </div>
        <h1 className="text-[2.25rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold mb-6 text-fy-text">
          {MARKETING_HERO.titleStart}{" "}
          <span className="text-brand-amber">{MARKETING_HERO.titleAccent}</span>
          <br />
          {MARKETING_HERO.titleEnd}
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-fy-soft max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-body">
          {MARKETING_HERO.description}
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center max-w-lg sm:max-w-none mx-auto">
          <Link
            href={MARKETING_HERO.ctaClient.href}
            data-marketing-event="hero_cta_client"
            className="btn-primary text-base sm:text-lg !py-3.5 sm:!py-4 !px-6 sm:!px-8 min-h-[48px] flex items-center justify-center text-center"
          >
            {MARKETING_HERO.ctaClient.label}
          </Link>
          <Link
            href={MARKETING_HERO.ctaDriver.href}
            data-marketing-event="hero_cta_driver"
            className="btn-secondary text-base sm:text-lg !py-3.5 sm:!py-4 !px-6 sm:!px-8 min-h-[48px] flex items-center justify-center text-center"
          >
            {MARKETING_HERO.ctaDriver.label}
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-12 text-fy-soft text-sm font-heading">
          {MARKETING_HERO.highlights.map((highlight) => (
            <span key={highlight}>{highlight}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 border-y border-fy-border bg-fy-bg-warm/40">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {MARKETING_STATS.map((s) => (
          <div key={s.label}>
            <div className={`text-3xl md:text-4xl font-display font-extrabold ${s.colorClass}`}>
              {s.value}
            </div>
            <div className="text-fy-soft text-sm mt-1 font-body">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-tag mb-4 inline-block">{MARKETING_HOW_IT_WORKS.sectionTag}</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-fy-text mt-3">
            {MARKETING_HOW_IT_WORKS.title}
          </h2>
          <p className="text-fy-soft mt-3 max-w-2xl mx-auto">
            {MARKETING_HOW_IT_WORKS.intro}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MARKETING_HOW_IT_WORKS.steps.map((item) => (
            <div key={item.step} className="card text-center !border-transparent hover:shadow-md transition-shadow">
              <div className={`w-16 h-16 ${item.bgClass} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4`}>
                {item.icon}
              </div>
              <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${item.accentClass} text-white text-xs font-bold font-heading mb-3`}>
                {item.step}
              </div>
              <h3 className="text-lg font-display font-bold text-fy-text mb-2">
                {item.title}
              </h3>
              <p className="text-fy-soft text-sm leading-relaxed text-left">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForDrivers() {
  return (
    <section id="fleteros" className="py-16 sm:py-20 px-4 sm:px-6 bg-brand-navy relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-amber/10 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-brand-teal-light text-xs font-bold font-heading tracking-wide mb-4">
            {MARKETING_FOR_DRIVERS.tag}
          </span>
          <p className="text-brand-teal-light/90 text-sm max-w-2xl mx-auto mt-4 leading-relaxed">
            {MARKETING_FOR_DRIVERS.intro}
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mt-10">
            {MARKETING_FOR_DRIVERS.titleLine1}
            <br />
            <span className="text-brand-amber">{MARKETING_FOR_DRIVERS.titleLine2}</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {MARKETING_FOR_DRIVERS.features.map((item) => (
            <div key={item.title} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex gap-4">
              <div className="text-2xl">{item.icon}</div>
              <div>
                <h3 className="font-heading font-bold text-white mb-1">{item.title}</h3>
                <p className="text-brand-teal-light/80 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href={MARKETING_FOR_DRIVERS.cta.href}
            data-marketing-event="drivers_cta_register"
            className="btn-primary text-lg !py-4 !px-8"
          >
            {MARKETING_FOR_DRIVERS.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="section-tag mb-4 inline-block">{MARKETING_REVIEWS.sectionTag}</span>
          <h2 className="text-3xl font-display font-bold text-fy-text mt-3">
            {MARKETING_REVIEWS.title}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {MARKETING_REVIEWS.items.map((r) => (
            <div key={r.name} className="card hover:shadow-md transition-shadow">
              <div className="text-brand-amber text-sm mb-3">
                {"★".repeat(r.rating)}
              </div>
              <p className="text-sm text-fy-soft leading-relaxed mb-4">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-teal-pale flex items-center justify-center text-brand-teal-light text-xs font-bold font-heading">
                  {r.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold font-heading text-fy-text">{r.name}</div>
                  <div className="text-xs text-fy-soft">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="precios" className="py-16 sm:py-20 px-4 sm:px-6 bg-fy-bg-warm/40">
      <div className="max-w-3xl mx-auto text-center">
        <span className="section-tag mb-4 inline-block">{MARKETING_PRICING.sectionTag}</span>
        <h2 className="text-3xl font-display font-bold text-fy-text mt-3 mb-4">
          {MARKETING_PRICING.title}
        </h2>
        <p className="text-fy-soft mb-12 max-w-lg mx-auto">
          {MARKETING_PRICING.intro}
        </p>
        <div className="card max-w-md mx-auto text-left !p-6 border-brand-teal-light/30">
          <div className="text-sm text-brand-teal-light font-bold font-heading tracking-wide uppercase mb-2">
            {MARKETING_PRICING.cardTitle}
          </div>
          <div className="text-5xl font-display font-extrabold text-brand-amber mb-2">
            {MARKETING_PRICING.cardRate}
          </div>
          <div className="text-fy-soft text-sm mb-6">
            {MARKETING_PRICING.cardDescription}
          </div>
          <div className="space-y-3">
            {MARKETING_PRICING.bullets.map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm">
                <span className="text-brand-teal-light">✓</span>
                <span className="text-fy-soft">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="section-tag mb-4 inline-block">{MARKETING_FAQ.sectionTag}</span>
          <h2 className="text-3xl font-display font-bold text-fy-text mt-3">
            {MARKETING_FAQ.title}
          </h2>
        </div>
        <div className="space-y-4">
          {MARKETING_FAQ.items.map((item) => (
            <article key={item.question} className="card !p-5">
              <h3 className="text-base font-heading font-bold text-fy-text mb-2">
                {item.question}
              </h3>
              <p className="text-sm text-fy-soft leading-relaxed">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-10 sm:py-12 px-4 sm:px-6 border-t border-fy-border bg-brand-ink text-white pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="max-w-6xl mx-auto min-w-0">
        <p className="mb-6 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
          {INSTITUTIONAL_WEB_RESUME.scope}: {INSTITUTIONAL_WEB_RESUME.objective}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-10 sm:mb-12">
          <div>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-2xl font-display font-extrabold text-white">flete</span>
              <span className="text-2xl font-display font-extrabold text-brand-amber">ya</span>
            </div>
            <p className="text-brand-teal-light/70 text-sm leading-relaxed">
              Marketplace de fletes con retornos y asignación por la plataforma. Mudanzas, mercadería y más en AMBA.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-3 text-brand-teal-light">Producto</h4>
            <div className="space-y-2 text-sm text-white/50">
              {FOOTER_PRODUCT_LINKS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block hover:text-brand-teal-light transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-2 text-brand-teal-light">
              {FOOTER_SECTIONS.company.title}
            </h4>
            <p className="text-white/40 text-xs mb-3 leading-relaxed">
              {FOOTER_SECTIONS.company.description}
            </p>
            <div className="space-y-2 text-sm text-white/50">
              {FOOTER_COMPANY_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block hover:text-brand-teal-light transition-colors"
                >
                  <span className="block">{item.label}</span>
                  <span className="block text-[11px] text-white/35 leading-relaxed">
                    {item.description}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-2 text-brand-teal-light">
              {FOOTER_SECTIONS.legal.title}
            </h4>
            <p className="text-white/40 text-xs mb-3 leading-relaxed">
              {FOOTER_SECTIONS.legal.description}
            </p>
            <div className="space-y-2 text-sm text-white/50">
              {FOOTER_LEGAL_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block hover:text-brand-teal-light transition-colors"
                >
                  <span className="block">{item.label}</span>
                  <span className="block text-[11px] text-white/35 leading-relaxed">
                    {item.description}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-white/40 text-sm">
            © {new Date().getFullYear()} FleteYa SAS. Todos los derechos reservados.
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-white/40 text-sm">
            <span className="w-full text-center text-xs text-white/35">
              {FOOTER_SECTIONS.social.title}: {FOOTER_SECTIONS.social.description}
            </span>
            {FOOTER_SOCIAL_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-teal-light transition-colors"
                title={item.description}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://fletaya.com.ar/#organization",
        name: "FleteYa",
        url: "https://fletaya.com.ar",
        sameAs: FOOTER_SOCIAL_LINKS.map((item) => item.href),
      },
      {
        "@type": "WebSite",
        "@id": "https://fletaya.com.ar/#website",
        url: "https://fletaya.com.ar",
        name: "FleteYa",
        inLanguage: "es-AR",
      },
      {
        "@type": "Service",
        "@id": "https://fletaya.com.ar/#service",
        serviceType: "Marketplace de fletes",
        areaServed: "AMBA",
        provider: {
          "@id": "https://fletaya.com.ar/#organization",
        },
      },
      {
        "@type": "FAQPage",
        "@id": "https://fletaya.com.ar/#faq",
        mainEntity: MARKETING_FAQ.items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <main className="min-w-0 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(() => {
  if (typeof window === "undefined") return;
  const onClick = (ev) => {
    const target = ev.target instanceof Element ? ev.target.closest("[data-marketing-event]") : null;
    if (!target) return;
    const eventName = target.getAttribute("data-marketing-event");
    if (!eventName) return;
    const href = target.getAttribute("href") || "";
    const payload = { event: "marketing_click", marketing_event: eventName, href };
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(payload);
    }
    window.dispatchEvent(new CustomEvent("fletaya:marketing_click", { detail: payload }));
  };
  window.addEventListener("click", onClick, { passive: true });
})();`,
        }}
      />
      <MarketingNavbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <ForDrivers />
      <Reviews />
      <Pricing />
      <Faq />
      <Footer />
    </main>
  );
}
