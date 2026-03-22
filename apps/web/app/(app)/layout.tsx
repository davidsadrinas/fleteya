import Link from "next/link";

// TODO: Add auth check middleware - redirect to /login if not authenticated

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col max-w-md mx-auto">
      {/* App header */}
      <header className="px-5 py-3 border-b border-fy-border flex items-center justify-between shrink-0">
        <span className="text-xl font-display font-black gradient-text">FleteYa</span>
        <Link href="/(app)/settings" className="text-fy-dim text-xs bg-brand-card border border-fy-border rounded-lg px-3 py-1">
          ⚙️
        </Link>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Bottom navigation */}
      <nav className="flex justify-around py-2.5 pb-5 border-t border-fy-border bg-brand-surface shrink-0">
        {[
          { href: "/(app)/dashboard", icon: "⌂", label: "Inicio" },
          { href: "/(app)/shipment", icon: "◎", label: "Nuevo" },
          { href: "/(app)/tracking", icon: "📍", label: "Tracking" },
          { href: "/(app)/profile", icon: "◉", label: "Perfil" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-1 text-fy-dim hover:text-brand transition-colors"
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
