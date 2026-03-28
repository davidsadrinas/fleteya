import type { Metadata } from "next";
import Link from "next/link";
import { AuthSync } from "@/components/auth-sync";
import { OnboardingGate } from "@/components/onboarding-gate";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const NAV_ITEMS = [
  { href: "/dashboard", icon: "⌂", label: "Inicio" },
  { href: "/shipment", icon: "◎", label: "Envío" },
  { href: "/tracking", icon: "📍", label: "Mapa" },
  { href: "/profile", icon: "◉", label: "Perfil" },
  { href: "/admin", icon: "📊", label: "Admin" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthSync>
      <OnboardingGate>
        <div className="min-h-dvh min-h-[100dvh] flex flex-col lg:flex-row w-full mx-auto bg-brand-dark">
          {/* Desktop sidebar — hidden on mobile */}
          <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-fy-border bg-brand-surface">
            <div className="px-5 py-4 border-b border-fy-border">
              <span className="text-xl font-display font-black gradient-text">FleteYa</span>
            </div>
            <nav className="flex flex-col gap-1 p-3 flex-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-fy-soft hover:text-brand-teal-light hover:bg-brand-card transition-colors"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="p-3 border-t border-fy-border">
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-fy-dim hover:text-fy-text hover:bg-brand-card transition-colors"
              >
                <span className="text-lg">⚙️</span>
                <span>Configuración</span>
              </Link>
            </div>
          </aside>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0 max-w-md sm:max-w-lg lg:max-w-none mx-auto lg:mx-0 w-full lg:border-x-0 lg:shadow-none">
            {/* Mobile header — hidden on desktop */}
            <header className="flex lg:hidden px-4 sm:px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-fy-border items-center justify-between shrink-0">
              <span className="text-lg sm:text-xl font-display font-black gradient-text">FleteYa</span>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link
                  href="/settings"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-fy-dim text-sm bg-brand-card border border-fy-border rounded-lg px-3"
                  aria-label="Configuración"
                >
                  ⚙️
                </Link>
              </div>
            </header>

            {/* Desktop header bar */}
            <header className="hidden lg:flex px-6 py-3 border-b border-fy-border items-center justify-end shrink-0 gap-3">
              <ThemeToggle />
            </header>

            <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-0">
              <div className="lg:max-w-4xl lg:mx-auto">{children}</div>
            </main>

            {/* Mobile bottom nav — hidden on desktop */}
            <nav className="flex lg:hidden justify-around items-stretch gap-1 sm:gap-2 py-2 sm:py-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 border-t border-fy-border bg-brand-surface shrink-0">
              {NAV_ITEMS.filter((t) => t.href !== "/admin").map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-label={tab.label}
                  className="flex flex-1 flex-col items-center justify-center gap-1 min-w-0 min-h-[52px] px-1 touch-manipulation text-fy-dim hover:text-brand-teal-light active:text-brand-teal-light transition-colors [-webkit-tap-highlight-color:transparent]"
                >
                  <span className="text-lg sm:text-xl leading-none" aria-hidden>
                    {tab.icon}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-center leading-tight">
                    {tab.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </OnboardingGate>
    </AuthSync>
  );
}
