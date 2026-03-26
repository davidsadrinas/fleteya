"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#fleteros", label: "Soy fletero" },
  { href: "#precios", label: "Precios" },
] as const;

export function MarketingNavbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-fy-border bg-fy-bg/90 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1 shrink-0 py-2 min-h-[44px]">
          <span className="text-xl sm:text-2xl font-display font-extrabold text-fy-text">flete</span>
          <span className="text-xl sm:text-2xl font-display font-extrabold text-brand-amber">ya</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-fy-soft hover:text-brand-teal-light text-sm font-medium font-heading transition-colors py-2"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="btn-primary text-sm !py-2.5 !px-5">
            Ingresar
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            className="min-w-[44px] min-h-[44px] px-3 rounded-lg border border-fy-border text-fy-soft text-sm font-heading font-semibold hover:bg-white/5"
            aria-expanded={open}
            aria-controls="marketing-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Cerrar" : "Menú"}
          </button>
          <Link
            href="/login"
            className="btn-primary text-sm !py-2.5 !px-4 whitespace-nowrap min-h-[44px] flex items-center"
          >
            Ingresar
          </Link>
        </div>
      </div>

      {open ? (
        <div
          id="marketing-mobile-nav"
          className="md:hidden border-t border-fy-border bg-fy-bg/95 backdrop-blur-xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <ul className="py-2 space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex min-h-[44px] items-center text-fy-soft hover:text-brand-teal-light text-base font-medium font-heading py-2"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}
