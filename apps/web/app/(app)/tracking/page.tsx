/* eslint-disable @next/next/no-img-element */
"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { STATUS_META } from "@shared/types";
import { useRealtimeShipmentStatus, useRealtimeTracking, useShareLocation } from "@/lib/hooks";
import { createClient } from "@/lib/supabase-client";

type ChatMessage = {
  id: string;
  shipment_id: string;
  sender_user_id: string;
  body: string;
  quick_tag: string | null;
  created_at: string;
};

type ShipmentEvidence = {
  id: string;
  stage: "pickup" | "delivery";
  file_url: string;
  note: string | null;
  created_at: string;
};

type ShipmentDispute = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
};

const STATUSES = Object.entries(STATUS_META).map(([key, value]) => ({
  key,
  label: value.label,
  hint:
    key === "pending"
      ? "Publicado o esperando asignación."
      : key === "in_transit"
      ? "Rumbo al destino; GPS en vivo."
      : "Seguimiento operativo del envío.",
}));

const QUICK_MESSAGES = ["Ya salí", "Estoy llegando", "No encuentro la dirección"];

async function safeParseJson(res: Response): Promise<Record<string, unknown> | null> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) return null;
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function TrackingContent() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const shipmentId = searchParams?.get("shipmentId") ?? null;
  const [eta, setEta] = useState(25);
  const status = useRealtimeShipmentStatus(shipmentId);
  useRealtimeTracking(shipmentId);
  const { sharing, start, stop } = useShareLocation(shipmentId);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [evidence, setEvidence] = useState<ShipmentEvidence[]>([]);
  const [disputes, setDisputes] = useState<ShipmentDispute[]>([]);
  const [disputeReason, setDisputeReason] = useState("Diferencia de precio");
  const [disputeDetail, setDisputeDetail] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const current = useMemo(() => STATUSES.find((s) => s.key === status) ?? STATUSES[0], [status]);

  const loadChat = useCallback(async () => {
    try {
      if (!shipmentId) return;
      const res = await fetch(`/api/shipments/${shipmentId}/chat`);
      const json = await safeParseJson(res);
      if (res.ok) {
        setChatMessages(((json?.messages as ChatMessage[] | undefined) ?? []));
        return;
      }
      setFeedback((json?.error as string | undefined) ?? "No se pudo cargar el chat.");
    } catch {
      setFeedback("No se pudo cargar el chat.");
    }
  }, [shipmentId]);

  const loadEvidence = useCallback(async () => {
    try {
      if (!shipmentId) return;
      const res = await fetch(`/api/shipments/${shipmentId}/evidence`);
      const json = await safeParseJson(res);
      if (res.ok) {
        setEvidence(((json?.evidence as ShipmentEvidence[] | undefined) ?? []));
        return;
      }
      setFeedback((json?.error as string | undefined) ?? "No se pudo cargar la evidencia.");
    } catch {
      setFeedback("No se pudo cargar la evidencia.");
    }
  }, [shipmentId]);

  const loadDisputes = useCallback(async () => {
    try {
      if (!shipmentId) return;
      const res = await fetch(`/api/shipments/${shipmentId}/disputes`);
      const json = await safeParseJson(res);
      if (res.ok) {
        setDisputes(((json?.disputes as ShipmentDispute[] | undefined) ?? []));
        return;
      }
      setFeedback((json?.error as string | undefined) ?? "No se pudo cargar los tickets.");
    } catch {
      setFeedback("No se pudo cargar los tickets.");
    }
  }, [shipmentId]);

  useEffect(() => {
    if (!shipmentId) return;
    void loadChat();
    void loadEvidence();
    void loadDisputes();

    const channel = supabase
      .channel(`shipment-chat-${shipmentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shipment_chat_messages",
          filter: `shipment_id=eq.${shipmentId}`,
        },
        () => {
          void loadChat();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadChat, loadDisputes, loadEvidence, shipmentId, supabase]);

  const sendChat = async (message: string, quickTag?: string) => {
    try {
      if (!shipmentId) return;
      const text = message.trim();
      if (!text) return;
      const res = await fetch(`/api/shipments/${shipmentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, quickTag: quickTag ?? null }),
      });
      if (!res.ok) {
        const json = await safeParseJson(res);
        setFeedback((json?.error as string | undefined) ?? "No se pudo enviar el mensaje.");
        return;
      }
      setChatText("");
      setFeedback(null);
      await loadChat();
    } catch {
      setFeedback("No se pudo enviar el mensaje.");
    }
  };

  const uploadEvidence = async (stage: "pickup" | "delivery", file: File) => {
    try {
      if (!shipmentId) return;
      const filePath = `${shipmentId}/${stage}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("shipment-evidence")
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        setFeedback(uploadError.message);
        return;
      }
      const publicUrl = supabase.storage.from("shipment-evidence").getPublicUrl(filePath).data.publicUrl;
      const res = await fetch(`/api/shipments/${shipmentId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, fileUrl: publicUrl }),
      });
      if (!res.ok) {
        const json = await safeParseJson(res);
        setFeedback((json?.error as string | undefined) ?? "No se pudo guardar la evidencia.");
        return;
      }
      setFeedback("Evidencia cargada.");
      await loadEvidence();
    } catch {
      setFeedback("No se pudo guardar la evidencia.");
    }
  };

  const reportProblem = async () => {
    try {
      if (!shipmentId) return;
      const res = await fetch(`/api/shipments/${shipmentId}/disputes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: disputeReason, description: disputeDetail }),
      });
      const json = await safeParseJson(res);
      if (!res.ok) {
        setFeedback((json?.error as string | undefined) ?? "No se pudo crear el ticket.");
        return;
      }
      setDisputeDetail("");
      setFeedback("Ticket creado. Soporte revisará el caso.");
      await loadDisputes();
    } catch {
      setFeedback("No se pudo crear el ticket.");
    }
  };

  return (
    <div className="px-4 sm:px-5 py-5 pb-10 max-w-lg mx-auto min-w-0">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">📍</div>
        <h2 className="text-lg font-display font-bold mb-2">Tracking en vivo</h2>
        <p className="text-fy-dim text-sm leading-relaxed">
          Seguimiento en tiempo real del fletero con actualizaciones por Supabase Realtime.
        </p>
      </div>

      <section className="rounded-2xl border border-brand-teal/30 bg-brand-teal/5 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-fy-text">
            {current.label}
          </p>
          <span className="text-xs text-brand-teal-light">ETA {eta} min</span>
        </div>
        <p className="text-xs text-fy-soft mb-3">{current.hint}</p>
        <div className="h-2 bg-brand-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-teal-light transition-all"
            style={{ width: `${Math.min(100, Math.max(10, ((STATUSES.findIndex((s) => s.key === current.key) + 1) / STATUSES.length) * 100))}%` }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-fy-border bg-brand-card/40 p-4 mb-6">
        <h3 className="text-xs font-heading font-bold text-brand-teal-light uppercase tracking-wide mb-3">
          Estados del viaje
        </h3>
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {STATUSES.map((s) => (
            <li
              key={s.key}
              className="flex gap-3 text-left text-xs border-b border-fy-border/60 pb-2 last:border-0 last:pb-0"
            >
              <span
                className={`shrink-0 w-2 h-2 mt-1 rounded-full ${
                  s.key === current.key ? "bg-brand-teal-light animate-pulse-slow" : "bg-fy-border"
                }`}
              />
              <div>
                <div className="font-semibold text-fy-text">{s.label}</div>
                <div className="text-fy-dim">{s.hint}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-fy-border p-4 bg-brand-card/20 mb-4">
        <p className="text-xs text-fy-soft leading-relaxed mb-3">
          Shipment: <span className="text-fy-text font-mono">{shipmentId ?? "sin id"}</span>
        </p>
        <button
          type="button"
          className="w-full rounded-lg border border-brand-teal/30 bg-brand-teal/10 py-2 text-sm font-semibold text-brand-teal-light"
          onClick={async () => {
            if (sharing) {
              stop();
              return;
            }
            await start();
            setEta((x) => Math.max(5, x - 2));
          }}
        >
          {sharing ? "⏹️ Detener ubicación compartida" : "Compartir ubicación (fletero)"}
        </button>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { label: "Llegué al origen", value: "at_origin" },
            { label: "Cargando", value: "loading" },
            { label: "En tránsito", value: "in_transit" },
            { label: "Llegando", value: "arriving" },
            { label: "Entregado", value: "delivered" },
          ].map((next) => (
            <button
              key={next.value}
              type="button"
              className="rounded-md border border-fy-border px-2 py-1.5 text-[11px]"
              onClick={async () => {
                if (!shipmentId) return;
                await supabase
                  .from("shipments")
                  .update({ status: next.value, updated_at: new Date().toISOString() })
                  .eq("id", shipmentId);
              }}
            >
              {next.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-fy-border p-4 bg-brand-card/20">
        <p className="text-sm font-semibold mb-2">Contacto del fletero</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-fy-text">Conductor asignado</p>
            <p className="text-[11px] text-fy-dim">Rating 4.8 · Camioneta</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-md border border-fy-border px-2.5 py-1.5 text-xs">Llamar</button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-fy-border p-4 bg-brand-card/20 mt-4">
        <p className="text-sm font-semibold mb-2">Chat in-app</p>
        <div className="max-h-44 overflow-y-auto space-y-2 pr-1 mb-3">
          {chatMessages.length ? (
            chatMessages.map((msg) => (
              <div key={msg.id} className="rounded-md border border-fy-border p-2">
                <p className="text-xs text-fy-text">{msg.body}</p>
                <p className="text-[10px] text-fy-dim">
                  {new Date(msg.created_at).toLocaleTimeString("es-AR")}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-fy-dim">Todavía no hay mensajes.</p>
          )}
        </div>
        <div className="flex gap-2 mb-2">
          {QUICK_MESSAGES.map((quick) => (
            <button
              key={quick}
              type="button"
              className="rounded-md border border-fy-border px-2 py-1 text-[11px] text-fy-soft"
              onClick={() => void sendChat(quick, quick)}
            >
              {quick}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder="Escribí un mensaje"
            className="input flex-1 text-xs py-2"
          />
          <button
            type="button"
            className="rounded-md border border-brand-teal/30 bg-brand-teal/10 px-3 py-1.5 text-xs"
            onClick={() => void sendChat(chatText)}
          >
            Enviar
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-fy-border p-4 bg-brand-card/20 mt-4">
        <p className="text-sm font-semibold mb-2">Evidencia pre / post carga</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="text-xs text-fy-soft">
            Retiro (pre-carga)
            <input
              type="file"
              accept="image/*"
              className="block mt-1 text-[11px]"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadEvidence("pickup", file);
              }}
            />
          </label>
          <label className="text-xs text-fy-soft">
            Entrega (post-carga)
            <input
              type="file"
              accept="image/*"
              className="block mt-1 text-[11px]"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadEvidence("delivery", file);
              }}
            />
          </label>
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {evidence.length ? (
            evidence.map((item) => (
              <a
                key={item.id}
                href={item.file_url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md border border-fy-border p-2 text-xs"
              >
                {item.stage === "pickup" ? "Pre-carga" : "Post-carga"} ·{" "}
                {new Date(item.created_at).toLocaleString("es-AR")}
              </a>
            ))
          ) : (
            <p className="text-xs text-fy-dim">Sin evidencia cargada.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-fy-border p-4 bg-brand-card/20 mt-4">
        <p className="text-sm font-semibold mb-2">Reportar problema / disputa</p>
        <div className="space-y-2">
          <select
            className="input text-xs"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          >
            <option>Diferencia de precio</option>
            <option>Carga dañada</option>
            <option>Fletero no se presentó</option>
            <option>Demora excesiva</option>
            <option>Otro</option>
          </select>
          <textarea
            className="input min-h-20 text-xs"
            placeholder="Describí el problema"
            value={disputeDetail}
            onChange={(e) => setDisputeDetail(e.target.value)}
          />
          <button
            type="button"
            className="rounded-md border border-brand-error/40 bg-brand-error/10 px-3 py-1.5 text-xs text-brand-error"
            onClick={() => void reportProblem()}
          >
            Reportar problema
          </button>
        </div>
        <div className="mt-3 space-y-2 max-h-28 overflow-y-auto">
          {disputes.length ? (
            disputes.map((ticket) => (
              <div key={ticket.id} className="rounded-md border border-fy-border p-2">
                <p className="text-xs text-fy-text">{ticket.reason}</p>
                <p className="text-[10px] text-fy-dim">
                  {ticket.status} · {new Date(ticket.created_at).toLocaleString("es-AR")}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-fy-dim">Sin tickets activos.</p>
          )}
        </div>
      </section>

      {feedback ? (
        <p className="mt-4 rounded-md border border-brand-teal/30 bg-brand-teal/10 px-3 py-2 text-xs text-brand-teal-light">
          {feedback}
        </p>
      ) : null}

      <section className="rounded-xl border border-fy-border p-4 bg-brand-card/20 mt-4">
        <p className="text-sm font-semibold mb-2">Backlog Marketplace 2026</p>
        <ul className="text-xs text-fy-soft space-y-1.5">
          <li>• Fase 1: Chat + Evidencia + Disputas + Pricing por ruta real</li>
          <li>• Fase 2: Cotización sin login + Push inteligente + Recurrencia B2B</li>
          <li>• Fase 3: Offline-first + Rate limiting completo + Observabilidad</li>
        </ul>
      </section>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="px-4 sm:px-5 py-5 text-fy-soft">Cargando tracking…</div>}>
      <TrackingContent />
    </Suspense>
  );
}
