"use client";

import { useThemeStore } from "@/lib/stores";

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <button
      type="button"
      aria-label="Cambiar tema"
      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-fy-dim text-sm bg-brand-card border border-fy-border rounded-lg px-3"
      onClick={() => setMode(mode === "dark" ? "light" : "dark")}
      title={`Tema: ${mode}`}
    >
      {mode === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
