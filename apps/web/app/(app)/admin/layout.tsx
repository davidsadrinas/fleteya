"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/drivers", label: "Fleteros", icon: "🚛" },
  { href: "/admin/disputes", label: "Disputas", icon: "⚖️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthorized(false); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setAuthorized(profile?.role === "admin");
    };
    check();
  }, []);

  if (authorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-fy-dim animate-pulse">Verificando acceso...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="text-4xl">🔒</div>
        <h1 className="text-xl font-display font-bold text-fy-text">Acceso denegado</h1>
        <p className="text-fy-soft text-sm text-center">
          No tenés permisos de administrador.
        </p>
        <Link href="/dashboard" className="btn-primary text-sm">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-0 flex-1">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-52 border-r border-fy-border bg-brand-surface shrink-0 py-4">
        <div className="px-4 mb-4">
          <span className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wider">
            Admin Panel
          </span>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-teal/20 text-brand-teal-light"
                    : "text-fy-soft hover:text-fy-text hover:bg-brand-card"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top nav */}
      <div className="flex lg:hidden border-b border-fy-border bg-brand-surface overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? "border-brand-teal-light text-brand-teal-light"
                  : "border-transparent text-fy-soft"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
    </div>
  );
}
