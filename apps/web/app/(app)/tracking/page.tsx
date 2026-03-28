/* eslint-disable @next/next/no-img-element */
"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { STATUS_META } from "@shared/types";
import { useRealtimeShipmentStatus, useRealtimeTracking, useShareLocation } from "@/lib/hooks";
import { createClient } from "@/lib/supabase-client";
import { ChatPanel } from "@/components/tracking/chat-panel";
import { EvidencePanel } from "@/components/tracking/evidence-panel";
import { DisputesPanel } from "@/components/tracking/disputes-panel";

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

type ShipmentHeader = {
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  canShareGps: boolean;
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
  const [shipmentHeader, setShipmentHeader] = useState<ShipmentHeader>({
    driverId: null,
    driverName: null,
    driverPhone: null,
    canShareGps: false,
  });

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

  const loadShipmentHeader = useCallback(async () => {
    if (!shipmentId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: shipment } = await supabase
      .from("shipments")
      .select("id,driver_id")
      .eq("id", shipmentId)
      .maybeSingle();
    const driverId = (shipment as { driver_id?: string | null } | null)?.driver_id ?? null;
    if (!driverId) {
      setShipmentHeader({
        driverId: null,
        driverName: null,
        driverPhone: null,
        canShareGps: false,
      });
      return;
    }

    const { data: driver } = await supabase
      .from("drivers")
      .select("id,user_id")
      .eq("id", driverId)
      .maybeSingle();
    const driverUserId = (driver as { user_id?: string | null } | null)?.user_id ?? null;
    let driverName: string | null = null;
    let driverPhone: string | null = null;
    if (driverUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name,phone")
        .eq("id", driverUserId)
        .maybeSingle();
      driverName = (profile as { name?: string | null } | null)?.name ?? null;
      driverPhone = (profile as { phone?: string | null } | null)?.phone ?? null;
    }

    setShipmentHeader({
      driverId,
      driverName,
      driverPhone,
      canShareGps: Boolean(user?.id && driverUserId && user.id === driverUserId),
    });
  }, [shipmentId, supabase]);

  useEffect(() => {
    if (!shipmentId) return;
    void loadChat();
    void loadEvidence();
    void loadDisputes();
    void loadShipmentHeader();

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
  }, [loadChat, loadDisputes, loadEvidence, loadShipmentHeader, shipmentId, supabase]);

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
      const res = await fetch(`/api/shipments/${shipmentId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, fileUrl: filePath }),
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

  const openEvidence = async (pathOrUrl: string) => {
    try {
      if (!shipmentId) return;
      const looksLikeUrl = pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://");
      if (looksLikeUrl) {
        window.open(pathOrUrl, "_blank", "noopener,noreferrer");
        return;
      }
      const qs = new URLSearchParams({
        bucket: "shipment-evidence",
        path: pathOrUrl,
        shipmentId,
      });
      const res = await fetch(`/api/documents/signed-url?${qs.toString()}`);
      const json = await safeParseJson(res);
      if (!res.ok) {
        setFeedback((json?.error as string | undefined) ?? "No se pudo abrir la evidencia.");
        return;
      }
      const signedUrl = (json?.signedUrl as string | undefined) ?? "";
      if (!signedUrl) {
        setFeedback("No se pudo abrir la evidencia.");
        return;
      }
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      setFeedback("No se pudo abrir la evidencia.");
    }
  };

  return (
    <div className="px-4 sm:px-5 py-5 pb-10 max-w-lg mx-auto min-w-0">
      {!shipmentId ? (
        <div className="rounded-xl border border-brand-error/30 bg-brand-error/10 p-3 mb-4">
          <p className="text-sm text-brand-error font-semibold">Falta `shipmentId` para ver el tracking.</p>
          <p className="text-xs text-fy-soft mt-1">
            Abrí esta pantalla desde un envío activo o usando `/tracking?shipmentId=...`.
          </p>
        </div>
      ) : null}
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
        {shipmentHeader.canShareGps ? (
          <>
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
            {sharing ? (
              <p className="mt-2 text-xs text-brand-teal-light flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-teal-light animate-pulse-slow" />
                📍 Compartiendo ubicación
              </p>
            ) : null}
          </>
        ) : (
          <p className="rounded-lg border border-fy-border px-3 py-2 text-xs text-fy-dim">
            El GPS en vivo lo comparte únicamente el fletero asignado.
          </p>
        )}
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
                const res = await fetch(`/api/shipments/${shipmentId}/status`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: next.value }),
                });
                if (!res.ok) {
                  const json = await safeParseJson(res);
                  setFeedback(
                    (json?.error as string | undefined) ?? "No se pudo actualizar el estado del envío."
                  );
                }
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
            <p className="text-xs text-fy-text">
              {shipmentHeader.driverName ? shipmentHeader.driverName : "Conductor asignado"}
            </p>
            <p className="text-[11px] text-fy-dim">
              {shipmentHeader.driverPhone ? `Tel: ${shipmentHeader.driverPhone}` : "Datos en actualización"}
            </p>
          </div>
          <div className="flex gap-2">
            {shipmentHeader.driverPhone ? (
              <a
                href={`tel:${shipmentHeader.driverPhone}`}
                className="rounded-md border border-fy-border px-2.5 py-1.5 text-xs"
              >
                Llamar
              </a>
            ) : (
              <button className="rounded-md border border-fy-border px-2.5 py-1.5 text-xs" disabled>
                Llamar
              </button>
            )}
          </div>
        </div>
      </section>

      <ChatPanel
        messages={chatMessages}
        chatText={chatText}
        quickMessages={QUICK_MESSAGES}
        onChatTextChange={setChatText}
        onSendMessage={sendChat}
      />
      <EvidencePanel
        evidence={evidence}
        onUploadEvidence={uploadEvidence}
        onOpenEvidence={openEvidence}
      />
      <DisputesPanel
        disputes={disputes}
        disputeReason={disputeReason}
        disputeDetail={disputeDetail}
        onReasonChange={setDisputeReason}
        onDetailChange={setDisputeDetail}
        onReport={reportProblem}
      />

      {feedback ? (
        <p className="mt-4 rounded-md border border-brand-teal/30 bg-brand-teal/10 px-3 py-2 text-xs text-brand-teal-light">
          {feedback}
        </p>
      ) : null}

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
