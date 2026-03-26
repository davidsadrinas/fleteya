"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { isFacebookLoginEnabled } from "@/lib/config/auth-features";
import { createClient } from "@/lib/supabase-client";

function getCallbackUrl(next: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const n = next.startsWith("/") ? next : "/dashboard";
  return `${base}/auth/callback?next=${encodeURIComponent(n)}`;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const role = searchParams.get("role");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  const redirectWithRole = (): string => {
    if (role === "client" || role === "driver") {
      const u = new URL(next, window.location.origin);
      u.searchParams.set("role", role);
      return u.pathname + u.search;
    }
    return next;
  };

  const showFacebookLogin = isFacebookLoginEnabled();

  const handleOAuth = async (provider: "google" | "facebook") => {
    setOauthLoading(provider);
    setMessage(null);
    const target = redirectWithRole();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getCallbackUrl(target),
      },
    });
    setOauthLoading(null);
    if (error) setMessage(error.message);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    const target = redirectWithRole();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getCallbackUrl(target),
      },
    });
    setSending(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Te enviamos un enlace por correo. Revisá tu bandeja (y spam).");
  };

  return (
    <div className="min-h-dvh min-h-[100dvh] bg-fy-bg flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16 pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md min-w-0">
        <Link href="/" className="inline-flex items-center gap-1 mb-10">
          <span className="text-3xl font-display font-extrabold text-fy-text">flete</span>
          <span className="text-3xl font-display font-extrabold text-brand-amber">ya</span>
        </Link>

        <h1 className="text-2xl font-display font-bold text-fy-text mb-2">Ingresar</h1>
        <p className="text-fy-soft text-sm mb-8 leading-relaxed">
          Elegí cómo entrar. Si es tu primera vez, creamos tu cuenta y te guiamos en el onboarding (cliente o fletero). Los envíos se asignan por la plataforma después de las postulaciones.
        </p>

        {errorParam && (
          <div
            className="mb-6 rounded-md border border-brand-error/40 bg-brand-error/10 px-4 py-3 text-sm text-brand-error"
            role="alert"
          >
            {decodeURIComponent(errorParam)}
          </div>
        )}

        {message && (
          <div
            className={`mb-6 rounded-md border px-4 py-3 text-sm ${
              message.includes("enviamos")
                ? "border-brand-teal/40 bg-brand-teal/10 text-brand-teal-light"
                : "border-brand-error/40 bg-brand-error/10 text-brand-error"
            }`}
            role="status"
          >
            {message}
          </div>
        )}

        <div className="space-y-3 mb-8">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={!!oauthLoading}
            className="w-full flex items-center justify-center gap-3 rounded-md border border-fy-border bg-brand-surface/80 py-3 px-4 text-sm font-semibold text-fy-text hover:bg-white/10 transition-colors disabled:opacity-60"
          >
            {oauthLoading === "google" ? "…" : "Continuar con Google"}
          </button>
          {showFacebookLogin ? (
            <button
              type="button"
              onClick={() => handleOAuth("facebook")}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 rounded-md border border-fy-border bg-brand-surface/80 py-3 px-4 text-sm font-semibold text-fy-text hover:bg-white/10 transition-colors disabled:opacity-60"
            >
              {oauthLoading === "facebook" ? "…" : "Continuar con Facebook"}
            </button>
          ) : null}
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-fy-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide">
            <span className="bg-fy-bg px-3 text-fy-dim">o con correo</span>
          </div>
        </div>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-fy-soft mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="nombre@ejemplo.com"
            />
          </div>
          <button type="submit" disabled={sending} className="btn-primary w-full justify-center">
            {sending ? "Enviando…" : "Enviar enlace mágico"}
          </button>
        </form>

        <p className="mt-10 text-center text-xs text-fy-dim">
          <Link href="/" className="text-brand-teal-light hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh min-h-[100dvh] bg-fy-bg flex items-center justify-center text-fy-soft">
          Cargando…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
