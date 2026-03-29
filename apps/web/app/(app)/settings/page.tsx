/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import { usePushNotifications } from "@/lib/hooks";
import { apiFetch } from "@/lib/api-fetch";

const SECTIONS = [
  {
    title: "Cuenta",
    items: [
      {
        label: "Datos personales",
        desc: "Nombre, teléfono, avatar. Algunos campos vienen del login social o del onboarding.",
      },
      {
        label: "Cerrar sesión",
        desc: "Desconectar este dispositivo; la próxima vez tendrás que ingresar de nuevo.",
      },
    ],
  },
  {
    title: "Notificaciones",
    items: [
      {
        label: "Push y correo",
        desc: "Avisos de asignación, cambios de estado del viaje y mensajes (configuración detallada próximamente).",
      },
    ],
  },
  {
    title: "Pagos",
    items: [
      {
        label: "MercadoPago",
        desc: "Checkout y split de comisión (22%) según se implemente el flujo de pago en el wizard.",
      },
      {
        label: "Historial de cobros",
        desc: "Facturación y liquidaciones para fleteros (dashboard financiero en roadmap).",
      },
    ],
  },
  {
    title: "Preferencias",
    items: [
      {
        label: "Rol en la app",
        desc: "Cliente o fletero se define en el onboarding; cambios de rol pueden requerir soporte hasta que exista el flujo en UI.",
      },
      {
        label: "Eliminar cuenta",
        desc: "Proceso bajo política de datos; link a términos y privacidad desde la web pública cuando estén publicados.",
      },
    ],
  },
];

type ReferralData = {
  code: string;
  uses: number;
  max_uses: number;
  redemptions: { redeemer_name: string; created_at: string }[];
};

export default function SettingsPage() {
  const push = usePushNotifications();

  // Referral state
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [referralLoading, setReferralLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemMsg, setRedeemMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setReferral(d); })
      .catch(() => {})
      .finally(() => setReferralLoading(false));
  }, []);

  const handleRedeem = useCallback(async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    setRedeemMsg(null);
    try {
      const res = await apiFetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (!res.ok) setRedeemMsg({ type: "err", text: json.error });
      else {
        setRedeemMsg({ type: "ok", text: "Código canjeado correctamente" });
        setRedeemCode("");
      }
    } catch {
      setRedeemMsg({ type: "err", text: "Error de conexión" });
    } finally {
      setRedeeming(false);
    }
  }, [redeemCode]);

  const copyReferralCode = useCallback(() => {
    if (!referral?.code) return;
    navigator.clipboard.writeText(referral.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referral?.code]);

  return (
    <div className="px-4 sm:px-5 py-5 pb-10 max-w-lg mx-auto min-w-0 text-left">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">⚙️</div>
        <h2 className="text-lg font-display font-bold mb-2">Configuración</h2>
        <p className="text-fy-dim text-sm leading-relaxed">
          Centro único para cuenta, avisos y pagos. Acá tenés una vista consolidada de tus opciones y políticas vigentes.
        </p>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((sec) => (
          <section key={sec.title}>
            <h3 className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wide mb-3">
              {sec.title}
            </h3>
            <ul className="space-y-3">
              {sec.items.map((item) => (
                <li
                  key={item.label}
                  className="rounded-xl border border-fy-border bg-brand-card/30 p-4"
                >
                  <div className="font-heading font-semibold text-fy-text text-sm mb-1">{item.label}</div>
                  <p className="text-fy-dim text-xs leading-relaxed">{item.desc}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Push Notifications */}
      <section className="mb-6">
        <h3 className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wide mb-3">
          Notificaciones Push
        </h3>
        <div className="rounded-xl border border-fy-border bg-brand-card/30 p-4">
          {push.permission === "denied" ? (
            <p className="text-xs text-fy-dim">
              Las notificaciones están bloqueadas en tu navegador. Habilitá los permisos desde la configuración del sitio.
            </p>
          ) : push.subscribed ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-fy-text">Notificaciones activas</p>
                <p className="text-xs text-fy-dim">Recibirás avisos de estado, asignaciones y mensajes.</p>
              </div>
              <button
                onClick={push.unsubscribe}
                disabled={push.loading}
                className="rounded-lg border border-fy-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                Desactivar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-fy-text">Activar notificaciones</p>
                <p className="text-xs text-fy-dim">Enterate al instante de cambios en tus envíos.</p>
              </div>
              <button
                onClick={push.subscribe}
                disabled={push.loading}
                className="rounded-lg bg-brand-coral px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {push.loading ? "..." : "Activar"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Referral Program */}
      <section className="mb-6">
        <h3 className="text-xs font-heading font-bold text-brand-amber uppercase tracking-wide mb-3">
          Programa de Referidos
        </h3>
        {referralLoading ? (
          <p className="text-xs text-fy-dim">Cargando...</p>
        ) : referral ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-fy-border bg-brand-card/30 p-4">
              <p className="text-xs text-fy-dim mb-2">Tu código de referido</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-fy-bg border border-fy-border px-3 py-2 text-sm font-mono font-bold text-fy-text tracking-widest text-center">
                  {referral.code}
                </code>
                <button
                  onClick={copyReferralCode}
                  className="rounded-lg bg-brand-teal/20 px-3 py-2 text-xs font-semibold text-brand-teal-light"
                >
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              <p className="text-xs text-fy-dim mt-2">
                Usos: {referral.uses}/{referral.max_uses}
              </p>
            </div>

            {referral.redemptions.length > 0 && (
              <div className="rounded-xl border border-fy-border bg-brand-card/30 p-4">
                <p className="text-xs text-fy-dim mb-2">Referidos que usaron tu código</p>
                <ul className="space-y-1">
                  {referral.redemptions.map((r, i) => (
                    <li key={i} className="flex justify-between text-xs">
                      <span className="text-fy-text">{r.redeemer_name || "Usuario"}</span>
                      <span className="text-fy-dim">{new Date(r.created_at).toLocaleDateString("es-AR")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border border-fy-border bg-brand-card/30 p-4">
              <p className="text-xs text-fy-dim mb-2">Canjear código de referido</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="CODIGO123"
                  maxLength={12}
                  className="flex-1 rounded-lg border border-fy-border bg-fy-bg px-3 py-2 text-sm font-mono uppercase tracking-wider"
                />
                <button
                  onClick={handleRedeem}
                  disabled={redeeming || !redeemCode.trim()}
                  className="rounded-lg bg-brand-amber px-4 py-2 text-xs font-bold text-brand-ink disabled:opacity-50"
                >
                  {redeeming ? "..." : "Canjear"}
                </button>
              </div>
              {redeemMsg && (
                <p className={`text-xs mt-2 ${redeemMsg.type === "ok" ? "text-green-400" : "text-red-400"}`}>
                  {redeemMsg.text}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-fy-dim">Iniciá sesión para ver tu código de referido.</p>
        )}
      </section>

      <p className="mt-8 text-center text-[11px] text-fy-dim leading-relaxed">
        ¿Dudas sobre asignación o postulaciones? Revisá el inicio del dashboard o la landing en{" "}
        <a href="/#como-funciona" className="text-brand-teal-light hover:underline">
          cómo funciona
        </a>
        .
      </p>
    </div>
  );
}
