import Link from "next/link";
import { AuthSync } from "@/components/auth-sync";
import { OnboardingGate } from "@/components/onboarding-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthSync>
      <OnboardingGate>
        <div
          className="min-h-dvh min-h-[100dvh] flex flex-col w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto bg-brand-dark lg:border-x lg:border-fy-border lg:shadow-2xl shadow-black/30"
        >
          <header className="px-4 sm:px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-fy-border flex items-center justify-between shrink-0">
            <span className="text-lg sm:text-xl font-display font-black gradient-text">FleteYa</span>
            <Link
              href="/settings"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-fy-dim text-sm bg-brand-card border border-fy-border rounded-lg px-3"
              aria-label="Configuración"
            >
              ⚙️
            </Link>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-0">{children}</main>

          <nav className="flex justify-around items-stretch gap-1 sm:gap-2 py-2 sm:py-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 border-t border-fy-border bg-brand-surface shrink-0">
            {[
              { href: "/dashboard", icon: "⌂", label: "Inicio" },
              { href: "/shipment", icon: "◎", label: "Envío" },
              { href: "/tracking", icon: "📍", label: "Mapa" },
              { href: "/profile", icon: "◉", label: "Perfil" },
            ].map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
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
      </OnboardingGate>
    </AuthSync>
  );
}
